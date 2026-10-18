import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ATTRIBUTION = "Co-Authored-By: Warp <agent@warp.dev>";
const CHECKS = ["test", "test:publish", "lint", "typecheck", "build"];
const SECRET_PATTERN =
  /AIza[0-9A-Za-z_-]{35}|gh[pousr]_[0-9A-Za-z]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;

function git(root, ...args) {
  return execFileSync("git", ["--no-pager", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trimEnd();
}

function fingerprint(data, mode) {
  return createHash("sha256").update(data).update(String(mode)).digest("hex");
}

function collectFiles(root) {
  const paths = git(root, "ls-files", "--cached", "--others", "--exclude-standard", "-z");
  const files = new Map();
  for (const path of new Set(paths.split("\0").filter(Boolean))) {
    const fullPath = join(root, path);
    if (!existsSync(fullPath)) continue;
    const name = basename(path);
    if (
      name.startsWith(".env") ||
      /\.(pem|key|p12|pfx)$/i.test(name) ||
      /^id_(rsa|ed25519|ecdsa)(\.pub)?$/.test(name) ||
      path.split("/").some((part) => [".git", ".vercel", "node_modules", ".next"].includes(part))
    ) {
      throw new Error(`Refusing to publish sensitive or generated file: ${path}`);
    }
    const stat = lstatSync(fullPath);
    if (!stat.isFile()) {
      throw new Error(`Publish expects regular files only: ${path}`);
    }
    const content = readFileSync(fullPath);
    if (SECRET_PATTERN.test(content.toString("utf8"))) {
      throw new Error(`Possible secret found in ${path}; nothing was published.`);
    }
    files.set(path, { content, mode: stat.mode, hash: fingerprint(content, stat.mode) });
  }
  return files;
}

function sameFiles(before, after) {
  return before.size === after.size &&
    [...before].every(([path, file]) => file.hash === after.get(path)?.hash);
}

export function runValidation(directory) {
  for (const script of CHECKS) {
    console.log(`\nChecking: npm run ${script}`);
    const result = spawnSync("npm", ["run", script], {
      cwd: directory,
      stdio: "inherit",
      env: { ...process.env, CI: "1" },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`${script} failed; nothing was committed or pushed.`);
    }
  }
}

export function publish({
  root,
  message,
  checkOnly = false,
  validate = runValidation,
}) {
  root = realpathSync(root);
  if (!checkOnly && !message?.trim()) {
    throw new Error('Usage: npm run publish -- "Describe your changes" (or --check)');
  }
  if (git(root, "rev-parse", "--show-toplevel") !== root) {
    throw new Error("Run publish from the project repository root.");
  }
  if (git(root, "branch", "--show-current") !== "main") {
    throw new Error("Publish only runs on main. Switch branches deliberately first.");
  }
  for (const marker of ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply"]) {
    const path = git(root, "rev-parse", "--git-path", marker);
    if (existsSync(resolve(root, path))) {
      throw new Error("Finish the in-progress Git operation before publishing.");
    }
  }
  if (!checkOnly) {
    git(root, "remote", "get-url", "origin");
    git(root, "fetch", "origin", "main");
    const behind = Number(git(root, "rev-list", "--count", "HEAD..refs/remotes/origin/main"));
    if (behind) {
      throw new Error("main is behind or diverged from origin/main. Reconcile it before publishing.");
    }
  }
  const originalHead = git(root, "rev-parse", "HEAD");
  const originalIndex = git(root, "write-tree");
  const files = collectFiles(root);
  const temporary = mkdtempSync(join(tmpdir(), "curbday-publish-"));
  try {
    for (const [path, file] of files) {
      const target = join(temporary, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
      chmodSync(target, file.mode);
    }
    // Build-time credentials stay local, outside the files staged for Git.
    for (const name of [".env", ".env.local", ".env.production", ".env.production.local"]) {
      const source = join(root, name);
      if (existsSync(source)) copyFileSync(source, join(temporary, name));
    }
    if (existsSync(join(root, "node_modules"))) {
      symlinkSync(join(root, "node_modules"), join(temporary, "node_modules"), "dir");
    }
    console.log("Validating an isolated copy; your preview server can keep running.");
    validate(temporary);
    if (
      git(root, "branch", "--show-current") !== "main" ||
      originalHead !== git(root, "rev-parse", "HEAD") ||
      originalIndex !== git(root, "write-tree") ||
      !sameFiles(files, collectFiles(root))
    ) {
      throw new Error("Files or Git state changed during checks. Save your work and run publish again.");
    }
    if (checkOnly) {
      console.log("\nAll checks passed. Check-only mode: no commit or push.");
      return;
    }
    git(root, "add", "--all");
    if (git(root, "diff", "--cached", "--name-only")) {
      console.log(git(root, "commit", "-m", message.trim(), "-m", ATTRIBUTION));
    } else {
      console.log("No file changes to commit; checking for existing commits to push.");
    }
    // No force push: remote changes that arrive during validation are rejected safely.
    console.log(git(root, "push", "--set-upstream", "origin", "main"));
    console.log("\nPushed main. Vercel's Git integration can now build and deploy it.");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const usage = 'Usage: npm run publish -- "Describe your changes"\n       npm run publish -- --check';
  try {
    if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
      console.log(usage);
    } else {
      if (
        args.length !== 1 ||
        (args[0].startsWith("-") && args[0] !== "--check")
      ) {
        throw new Error(usage);
      }
      publish({
        root: process.cwd(),
        checkOnly: args[0] === "--check",
        message: args[0],
      });
    }
  } catch (error) {
    console.error(`\nPublish stopped: ${error.message}`);
    process.exitCode = 1;
  }
}
