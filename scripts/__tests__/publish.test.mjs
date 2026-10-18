import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { publish } from "../publish.mjs";

const ATTRIBUTION = "Co-Authored-By: Warp <agent@warp.dev>";

function fixture(t) {
  const temp = mkdtempSync(join(tmpdir(), "publish-test-"));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const root = join(temp, "project");
  const remote = join(temp, "origin.git");
  mkdirSync(root);
  const git = (...args) =>
    execFileSync("git", ["--no-pager", ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("init", "-b", "main");
  git("config", "user.name", "Publish Test");
  git("config", "user.email", "publish-test@example.invalid");
  git("config", "commit.gpgsign", "false");
  mkdirSync(join(temp, "hooks"));
  git("config", "core.hooksPath", join(temp, "hooks"));
  writeFileSync(join(root, ".gitignore"), ".env*\n.next/\nnode_modules/\n");
  writeFileSync(join(root, "app.txt"), "initial");
  git("add", ".");
  git("commit", "-m", "Initial test fixture", "-m", ATTRIBUTION);
  git("init", "--bare", remote);
  git("remote", "add", "origin", remote);
  git("push", "-u", "origin", "main");
  return { root, remote, git };
}

test("check-only mode validates a temporary copy without touching preview artifacts or Git", (t) => {
  const { root, git } = fixture(t);
  mkdirSync(join(root, ".next"));
  writeFileSync(join(root, ".next", "preview"), "keep running");
  writeFileSync(join(root, "app.txt"), "updated");
  writeFileSync(join(root, ".env.local"), "TEST_SETTING=local");
  const head = git("rev-parse", "HEAD");
  let copy;
  publish({
    root,
    checkOnly: true,
    validate(directory) {
      copy = directory;
      assert.notEqual(directory, root);
      assert.equal(readFileSync(join(directory, "app.txt"), "utf8"), "updated");
      assert.equal(readFileSync(join(directory, ".env.local"), "utf8"), "TEST_SETTING=local");
      assert.equal(existsSync(join(directory, ".next", "preview")), false);
    },
  });
  assert.equal(existsSync(copy), false);
  assert.equal(readFileSync(join(root, ".next", "preview"), "utf8"), "keep running");
  assert.equal(git("rev-parse", "HEAD"), head);
  assert.equal(git("diff", "--cached", "--name-only"), "");
});

test("switching branches during validation aborts even if HEAD is unchanged", (t) => {
  const { root, git } = fixture(t);
  const head = git("rev-parse", "HEAD");
  assert.throws(() => publish({
    root,
    message: "Must not publish",
    validate() { git("switch", "-c", "feature"); },
  }), /changed during checks/);
  assert.equal(git("rev-parse", "HEAD"), head);
  assert.equal(git("diff", "--cached", "--name-only"), "");
});

test("successful publish commits and pushes only to the temporary fixture remote", (t) => {
  const { root, remote, git } = fixture(t);
  writeFileSync(join(root, "app.txt"), "updated");
  publish({ root, message: "Update fixture", validate() {} });
  const remoteHead = execFileSync("git", ["--git-dir", remote, "rev-parse", "refs/heads/main"], {
    encoding: "utf8",
  }).trim();
  assert.equal(remoteHead, git("rev-parse", "HEAD"));
  assert.match(git("log", "-1", "--format=%B"), /Co-Authored-By: Warp <agent@warp.dev>/);
  assert.equal(git("status", "--porcelain"), "");
});

test("failed checks do not stage, commit, or push", (t) => {
  const { root, git } = fixture(t);
  writeFileSync(join(root, "app.txt"), "updated");
  const head = git("rev-parse", "HEAD");
  assert.throws(() => publish({
    root,
    message: "Must not publish",
    validate() { throw new Error("test check failed"); },
  }), /test check failed/);
  assert.equal(git("rev-parse", "HEAD"), head);
  assert.equal(git("diff", "--cached", "--name-only"), "");
  assert.equal(git("rev-parse", "origin/main"), head);
});

test("edits during validation abort publishing", (t) => {
  const { root, git } = fixture(t);
  const head = git("rev-parse", "HEAD");
  assert.throws(() => publish({
    root,
    message: "Must not publish",
    validate() { writeFileSync(join(root, "app.txt"), "changed during checks"); },
  }), /changed during checks/);
  assert.equal(git("rev-parse", "HEAD"), head);
  assert.equal(git("diff", "--cached", "--name-only"), "");
});

test("publishing on another branch is refused", (t) => {
  const { root, git } = fixture(t);
  git("switch", "-c", "feature");
  assert.throws(() => publish({ root, message: "No", validate() {} }), /only runs on main/);
});

test("publishing is refused if origin/main has commits missing locally", (t) => {
  const { root, git } = fixture(t);
  const old = git("rev-parse", "HEAD");
  writeFileSync(join(root, "app.txt"), "remote update");
  git("add", ".");
  git("commit", "-m", "Remote fixture update", "-m", ATTRIBUTION);
  git("push", "origin", "main");
  git("reset", "--soft", old);
  assert.throws(() => publish({ root, message: "No", validate() {} }), /behind or diverged/);
});

test("a force-staged environment file is refused", (t) => {
  const { root, git } = fixture(t);
  writeFileSync(join(root, ".env.local"), "TEST_SETTING=not-a-secret");
  git("add", "--force", ".env.local");
  assert.throws(() => publish({ root, checkOnly: true, validate() {} }), /sensitive or generated/);
});

test("a likely API key in a source file is refused without displaying it", (t) => {
  const { root } = fixture(t);
  writeFileSync(join(root, "config.txt"), ["AI", "za", "x".repeat(35)].join(""));
  assert.throws(() => publish({ root, checkOnly: true, validate() {} }), /Possible secret found in config.txt/);
});

test("a commit message is required for publishing", (t) => {
  const { root } = fixture(t);
  assert.throws(() => publish({ root, validate() {} }), /Usage:/);
});
