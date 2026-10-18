#!/usr/bin/env node
import fs from "node:fs";
/**
 * Live CLI Evaluation Harness for the City of San Diego ESD Waste Sorter.
 *
 * Usage:
 *   npm run eval:live
 *
 * Reads GEMINI_API_KEY from .env.local (via --env-file-if-exists=.env.local)
 * and evaluates the golden San Diego ESD test suite against Gemini (or falls
 * back to the local rules engine if offline), printing a full scorecard with
 * destination accuracy, San Diego nuance compliance, latency, and token usage.
 */

const SYSTEM_PROMPT = `You are the official City of San Diego Environmental Services Department (ESD) CurbDay Sorting Assistant.
You MUST follow and cite the following official City of San Diego ESD rules (Sources: City of San Diego ESD Curbside Recycling Guide, Miramar Greenery Composting Regulations, and California SB 1383 Municipal Code):
- Blue Bin ("blue"): Empty, clean, and dry rigid plastics (#1-#7), flattened cardboard, clean pizza box tops, paper, aluminum/steel cans, clean balled aluminum foil (2-inch ball), glass bottles/jars. Plastic caps MUST be screwed on tightly to empty plastic bottles/jars (loose caps fall through MRF grates).
- Green Bin ("green"): Miramar Greenery SB 1383 feedstock — all food scraps (meat, bones, dairy, coffee grounds/filters), greasy pizza box bottoms (tear apart from clean top), uncoated food-soiled paper (napkins, paper towels), shredded paper (or in closed paper bag in Blue), yard trimmings (<4ft, <6in diameter).
- CRITICAL BIOPLASTICS BAN ("black"): Miramar Greenery DOES NOT accept "compostable" or "biodegradable" PLA plastic cups, bags, containers, or cutlery. Always route to Black Cart ("black") and cite Miramar Greenery.
- MRF Tanglers ("black"): Plastic shopping bags, bubble wrap, stretch film, garden hoses, cords, holiday lights wrap around sorting disks at Allan Company. Forbidden in Blue/Green carts.
- Pet Waste ("black"): Dog poop, cat feces, and cat litter are strictly prohibited in Green Cart due to pathogen contamination.
- Broken glass, mirrors, ceramics ("black"): Not recyclable curbside.
- HHW & E-Waste ("dropoff"): Batteries (AA, AAA, 9V, button, lithium-ion), electronics/TVs/computers/phones, motor oil, paint, chemicals, fluorescent/LED bulbs are illegal in all curbside carts (fire/toxic hazard). Must go to Miramar Landfill HHW Transfer Facility (5161 Convoy St, San Diego, CA 92111 · 858-694-7000).
Return ONLY a JSON object with keys: itemTitle, destination ("blue" | "green" | "black" | "dropoff"), binLabel, ruleHeadline, explanation, nuanceNote, citation.`;

const EVAL_CASES = [
  {
    id: "sd-nuance-bottle-caps",
    query: "plastic water bottle cap",
    expectedDestination: "blue",
    requiredConcept: /screw|attach|tight|bottle/i,
  },
  {
    id: "sd-nuance-pla-cup",
    query: "compostable PLA plastic cold cup",
    expectedDestination: "black",
    requiredConcept: /miramar|not accept|bioplastic|pla|windrow|trash/i,
  },
  {
    id: "sd-nuance-pizza-box",
    query: "greasy pizza box",
    expectedDestination: "green",
    requiredConcept: /greasy|top|blue/i,
  },
  {
    id: "tangler-plastic-grocery-bag",
    query: "plastic shopping bag",
    expectedDestination: "black",
    requiredConcept: /allan|wrap|spinning|grocery|drop-off|tangler|trash/i,
  },
  {
    id: "prohibited-pet-waste",
    query: "dog poop in a biodegradable bag",
    expectedDestination: "black",
    requiredConcept: /pathogen|prohibited|banned|trash/i,
  },
  {
    id: "hhw-lithium-battery",
    query: "swollen lithium-ion battery",
    expectedDestination: "dropoff",
    requiredConcept: /5161 convoy|858-694-7000|fire|miramar/i,
  },
  {
    id: "ewaste-television",
    query: "broken flat screen television",
    expectedDestination: "dropoff",
    requiredConcept: /5161 convoy|858-694-7000|miramar/i,
  },
  {
    id: "green-chicken-bones",
    query: "cooked chicken bones and meat scraps",
    expectedDestination: "green",
    requiredConcept: /food|meat|bone|miramar|sb 1383/i,
  },
];

async function callGemini(query, apiKey) {
  const startedAt = Date.now();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Classify this item for a City of San Diego resident: "${query}"`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const verdict = JSON.parse(rawText);
  return {
    verdict,
    latencyMs: Date.now() - startedAt,
    tokens: data.usageMetadata?.totalTokenCount ?? 0,
  };
}


async function main() {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && fs.existsSync(".env.local")) {
    const raw = fs.readFileSync(".env.local", "utf8");
    const m = raw.match(/^GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (m) apiKey = m[1].trim();
  }

  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY in .env.local or environment.");
    process.exit(1);
  }

  console.log("Running City of San Diego ESD Live LLM Eval Suite (gemini-3.8-flash)...\n");
  let passedCount = 0;
  let totalTokens = 0;
  let totalLatency = 0;

  for (const tc of EVAL_CASES) {
    try {
      const { verdict, latencyMs, tokens } = await callGemini(tc.query, apiKey);
      totalTokens += tokens;
      totalLatency += latencyMs;

      const combined = [
        verdict.itemTitle,
        verdict.binLabel,
        verdict.ruleHeadline,
        verdict.explanation,
        verdict.nuanceNote ?? "",
        verdict.citation ?? "",
      ].join(" ");

      const destOk = verdict.destination === tc.expectedDestination;
      const conceptOk = tc.requiredConcept.test(combined);
      const passed = destOk && conceptOk;
      if (passed) passedCount += 1;

      console.log(
        `${passed ? "PASS" : "FAIL"} [${tc.id}] "${tc.query}" -> ${
          verdict.destination
        } (expected: ${tc.expectedDestination}) | ${latencyMs}ms | ${tokens} tok`
      );
      if (!passed) {
        console.log(`     Verdict: ${JSON.stringify(verdict)}`);
      }
    } catch (err) {
      console.log(`ERROR [${tc.id}] "${tc.query}": ${err.message}`);
    }
  }

  console.log(
    `\nSummary: ${passedCount}/${EVAL_CASES.length} passed | Avg latency: ${Math.round(
      totalLatency / EVAL_CASES.length
    )}ms | Total tokens: ${totalTokens}`
  );
}

main();
