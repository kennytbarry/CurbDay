import { describe, expect, it } from "vitest";
import {
  classifyWasteItem,
  ESD_EVAL_SUITE,
  ESD_SORTING_SYSTEM_PROMPT,
  evaluateSortingVerdict,
  getActionableSteps,
  getConditionalPivot,
  getQuickWhy,
  getSituationalOptions,
} from "@/lib/esd-knowledge";

describe("City of San Diego ESD Knowledge Base (Section 2.4)", () => {
  it("embeds the official ESD, Miramar Greenery, and SB 1383 ground-truth rules in the LLM system prompt", () => {
    expect(ESD_SORTING_SYSTEM_PROMPT).toContain("Empty, Clean, and Dry");
    expect(ESD_SORTING_SYSTEM_PROMPT).toContain("SCREWED ON TIGHTLY");
    expect(ESD_SORTING_SYSTEM_PROMPT).toContain("Miramar Greenery");
    expect(ESD_SORTING_SYSTEM_PROMPT).toContain("SB 1383");
    expect(ESD_SORTING_SYSTEM_PROMPT).toContain("PLA plastics");
    expect(ESD_SORTING_SYSTEM_PROMPT).toContain("5161 Convoy St, San Diego, CA 92111");
    expect(ESD_SORTING_SYSTEM_PROMPT).toContain("858-694-7000");
  });

  it("instructs residents to screw plastic bottle caps on tightly (Blue Cart)", () => {
    const verdict = classifyWasteItem("plastic bottle caps");
    expect(verdict.destination).toBe("blue");
    expect(verdict.ruleHeadline).toContain("Screw Cap Tightly");
    expect(verdict.nuanceNote).toContain("Material Recovery Facility");
  });

  it("routes 'compostable' / PLA bioplastic cups and cutlery to Black Cart per Miramar Greenery rules", () => {
    const verdict = classifyWasteItem("compostable plastic cup");
    expect(verdict.destination).toBe("black");
    expect(verdict.explanation).toContain("Miramar Greenery DOES NOT accept");
    expect(verdict.citation).toContain("Miramar Greenery");
  });

  it("explains how to split greasy pizza box bottoms (Green) and clean tops (Blue)", () => {
    const verdict = classifyWasteItem("pizza box");
    expect(verdict.destination).toBe("green");
    expect(verdict.explanation).toContain("greasy");
    expect(verdict.explanation).toContain("Blue Cart");
  });

  it("prohibits tanglers like plastic bags and garden hoses in the Blue Cart", () => {
    const bagVerdict = classifyWasteItem("plastic shopping bag");
    expect(bagVerdict.destination).toBe("black");
    expect(bagVerdict.explanation).toContain("Allan Company");

    const hoseVerdict = classifyWasteItem("garden hose");
    expect(hoseVerdict.destination).toBe("black");
  });

  it("prohibits pet waste and cat litter in the Green Cart", () => {
    const verdict = classifyWasteItem("cat litter");
    expect(verdict.destination).toBe("black");
    expect(verdict.explanation).toContain("pathogen");
  });

  it("routes batteries, electronics, and hazardous chemicals to the Miramar HHW Transfer Facility (5161 Convoy St)", () => {
    for (const item of ["lithium battery", "old laptop", "motor oil"]) {
      const verdict = classifyWasteItem(item);
      expect(verdict.destination).toBe("dropoff");
      expect(verdict.nuanceNote).toContain("5161 Convoy St");
      expect(verdict.nuanceNote).toContain("858-694-7000");
    }
  });

  it("routes mattresses and bulky furniture to dropoff per paused curbside collection and Miramar Bye Bye Mattress", () => {
    const mattressVerdict = classifyWasteItem("mattress or other bulky furniture");
    expect(mattressVerdict.destination).toBe("dropoff");
    expect(mattressVerdict.binLabel).toContain("Miramar");
    expect(mattressVerdict.explanation).toContain("paused");
    expect(mattressVerdict.nuanceNote).toContain("Bye Bye Mattress");
    expect(getQuickWhy(mattressVerdict)).toContain("Bye Bye Mattress");
    expect(getActionableSteps(mattressVerdict)[0]).toContain("paused");

    const couchVerdict = classifyWasteItem("broken couch or bulky table");
    expect(couchVerdict.destination).toBe("dropoff");
    expect(couchVerdict.explanation).toContain("paused");
    expect(couchVerdict.explanation).toContain("Facebook Marketplace");
    expect(couchVerdict.nuanceNote).toContain("Miramar Landfill");
    expect(getActionableSteps(couchVerdict)[0]).toContain("Facebook Marketplace");
  });

  it("accepts meat, bones, dairy, coffee grounds, and yard trimmings in the Green Cart", () => {
    for (const item of ["chicken bones", "coffee grounds", "tree trimmings"]) {
      const verdict = classifyWasteItem(item);
      expect(verdict.destination).toBe("green");
      expect(verdict.citation).toContain("SB 1383");
    }
  });

  it("distinguishes clean balled aluminum foil (Blue) from food-soiled foil (Black)", () => {
    const cleanVerdict = classifyWasteItem("clean aluminum foil");
    expect(cleanVerdict.destination).toBe("blue");
    expect(cleanVerdict.nuanceNote).toContain("2-inch");

    const soiledVerdict = classifyWasteItem("aluminum foil with food on it");
    expect(soiledVerdict.destination).toBe("black");
    expect(soiledVerdict.binLabel).toContain("Black Cart");
  });

  it("handles grey-area dilemma items: packing peanuts and wrapping paper", () => {
    const peanutsVerdict = classifyWasteItem("packing peanuts");
    expect(peanutsVerdict.destination).toBe("black");
    expect(peanutsVerdict.nuanceNote).toContain("Water test");

    const wrapVerdict = classifyWasteItem("wrapping paper");
    expect(wrapVerdict.destination).toBe("blue");
    expect(wrapVerdict.ruleHeadline).toContain("Plain Paper");
  });

  it("extracts operational quick why, actionable steps, and conditional pivots", () => {
    const pizzaVerdict = classifyWasteItem("greasy pizza box");
    expect(getQuickWhy(pizzaVerdict)).toContain("Miramar Greenery");
    expect(getActionableSteps(pizzaVerdict)).toHaveLength(3);
    const pivot = getConditionalPivot(pizzaVerdict);
    expect(pivot).not.toBeNull();
    expect(pivot?.alternateLabel).toContain("Blue Cart");

    const wrapVerdict = classifyWasteItem("wrapping paper");
    const situational = getSituationalOptions(wrapVerdict);
    expect(situational).not.toBeNull();
    expect(situational).toHaveLength(2);
    expect(situational?.[0].condition).toContain("Plain Paper");
    expect(situational?.[1].condition).toContain("Metallic");
  });

  it("passes 100% of the 20-case San Diego ESD golden evaluation suite", () => {
    for (const tc of ESD_EVAL_SUITE) {
      const verdict = classifyWasteItem(tc.query);
      const res = evaluateSortingVerdict(tc, verdict);
      if (!res.passed) {
        throw new Error(
          `Eval failed on "${tc.query}" (${tc.id}): ${res.failureReasons.join("; ")}`
        );
      }
      expect(res.passed).toBe(true);
    }
  });
});
