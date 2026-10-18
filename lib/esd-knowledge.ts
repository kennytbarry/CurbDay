/**
 * Official City of San Diego Environmental Services Department (ESD)
 * Waste Sorting Knowledge Base, Gemini LLM Sorter, & Eval Harness (Section 2.4).
 *
 * Sources cited:
 * - City of San Diego ESD Curbside Recycling Guide
 * - Miramar Greenery Composting Regulations
 * - California SB 1383 Municipal Code
 */

export type BinDestination = "blue" | "green" | "black" | "dropoff";

export interface SortingVerdict {
  query: string;
  itemTitle: string;
  destination: BinDestination;
  binLabel: string;
  ruleHeadline: string;
  explanation: string;
  nuanceNote?: string;
  citation: string;
}

export interface SortingTelemetry {
  source: "gemini" | "rules";
  model?: string;
  latencyMs: number;
  usage?: {
    promptTokens: number;
    candidateTokens: number;
    totalTokens: number;
  };
}

export const ESD_SORTING_SYSTEM_PROMPT = `You are the official City of San Diego Environmental Services Department (ESD) CurbDay Sorting Assistant.
You MUST follow and cite the following official City of San Diego ESD rules (Sources: City of San Diego ESD Curbside Recycling Guide, Miramar Greenery Composting Regulations, and California SB 1383 Municipal Code):

### A. Blue Cart (Curbside Recycling) — "Empty, Clean, and Dry"
* Official City Rule: All items must be empty, rinsed free of food residue, and dry before disposal.
* Accepted Items:
  - Rigid plastics (#1 through #7): Beverage bottles, condiment jars, peanut butter jars, yogurt/butter tubs, detergent jugs.
  - Paper & Cardboard: Clean cardboard (flattened), clean pizza box tops, office paper, magazines, paper bags, egg cartons (paper), milk and juice cartons.
  - Metals: Aluminum cans, tin/steel food cans (rinsed), clean aluminum foil and foil trays (balled up).
  - Glass: Bottles and jars (brown, green, clear).
* San Diego Nuances & Common Dilemmas:
  - Plastic Bottle & Jar Caps: Unlike Los Angeles or older guidelines, the City of San Diego explicitly requests that plastic caps remain SCREWED ON TIGHTLY to empty, clean plastic bottles and jars. Loose caps fall through the sorting grates at the Material Recovery Facility (MRF).
  - Shredded Paper: NEVER place loose in the Blue Cart. If placed in blue recycling, it must be contained inside a secured paper bag, or placed in the Green Cart.
  - Tanglers (PROHIBITED): Plastic shopping bags, plastic wrap, bubble wrap, stretch film, garden hoses, electrical cords, holiday lights, and wires are strictly forbidden in the Blue Cart. They wrap around sorting spinning disks at the Allan Company recycling center. Plastic shopping bags must be returned to retail grocery drop-off bins or placed in the Black Cart (destination: "black").
  - Broken Glass, Window Panes, & Ceramics: NOT recyclable curbside. Wrap and dispose of in Black Cart (Trash).
  - Soiled Aluminum Foil: Aluminum foil or foil trays contaminated with baked-on food, grease, or cheese cannot be recycled in the Blue Cart (which strictly requires items to be empty, clean, and dry) and cannot go in the Green Cart. Route to Black Cart (destination: "black").

### B. Green Cart (Organics & SB 1383) — "Miramar Greenery Feedstock"
* Program Scope: Organic waste in San Diego is processed at the Miramar Greenery into nutrient-rich compost and mulch under California Senate Bill 1383 mandates.
* Accepted Items:
  - All Food Scraps: Raw and cooked food scraps, meat, poultry, fish, bones, shells, dairy products (cheese, butter, peanut butter), fruit/vegetable peels, plate scrapings, coffee grounds and paper filters, tea leaves.
  - Food-Soiled Uncoated Paper: Greasy pizza box bottoms (for whole pizza boxes, set destination to "green" and explain tearing off the clean top for the Blue Cart and putting the greasy bottom in the Green Cart), paper napkins, paper towels, paper plates without plastic lining, paper food bags, paper takeout containers without wax/plastic linings.
  - Yard & Garden Trimmings: Leaves, grass clippings, weeds, branches/tree trimmings (under 4 feet long and under 6 inches in diameter).
* San Diego Nuances & Common Dilemmas:
  - "Compostable" / "Biodegradable" Bioplastics (CRITICAL CITY RULE): The City of San Diego Miramar Greenery DOES NOT ACCEPT "compostable" or "biodegradable" plastic bags, cups, containers, or cutlery (PLA plastics). The processing equipment cannot distinguish them from petroleum plastics, and they do not break down fast enough in municipal compost windrows. Always route these to Black Cart (destination: "black") and cite Miramar Greenery.
  - Bagging Food Scraps: Food waste must either be placed directly into the Green Cart, or wrapped inside newspaper, paper bags, napkins, or paper towels. No plastic bags of any kind.
  - Pet Waste (PROHIBITED): Dog/cat feces and cat litter are strictly prohibited in the Green Cart due to pathogen contamination. Pet waste belongs in the Black Cart (destination: "black").
  - Treated Wood, Dirt, & Rocks: Strictly forbidden in the Green Cart (destination: "black").

### C. Black Cart (Trash / Landfill)
* Items that cannot be recycled or composted: Styrofoam (expanded polystyrene packaging or food trays), plastic utensils/straws, potato chip bags, snack wrappers, pet food bags, diapers, sanitation wipes, hoses, broken mirrors, ceramics, waxed cardboard.

### D. Special Drop-Off Required (Household Hazardous Waste & E-Waste)
* Curbside Prohibition: It is illegal under California state law to place batteries or e-waste in any residential curbside cart (Black, Blue, or Green). Lithium batteries cause catastrophic truck and landfill fires.
* Items Requiring Drop-Off (destination: "dropoff"):
  - All batteries: AA, AAA, 9V, button cell, and rechargeable/lithium-ion batteries.
  - Electronics: Cell phones, computers, monitors, televisions.
  - Chemicals & Liquids: Motor oil, oil filters, paint, pesticides, household cleaners, fluorescent tubes, LED bulbs.
* Official Disposal Location: City of San Diego Household Hazardous Waste (HHW) Transfer Facility at the Miramar Landfill (5161 Convoy St, San Diego, CA 92111 — by appointment for City residents via 858-694-7000 or online).

### E. Bulky Items, Furniture & Landfill Deflection (Resell, Thrift, Donate)
* Curbside Bulky Pickup Paused: The City of San Diego paused scheduled curbside bulky-item collection in June 2026. Leaving bulky items, furniture, mattresses, or appliances at the curb is enforced as illegal dumping. Never place bulky items in the Black, Blue, or Green curbside carts.
* Deflect from Landfill (Reselling & Donating First):
  - Prioritize landfill deflection: Usable items with resale or reuse value (furniture, couches, tables, desks, working appliances) should be resold or gifted on peer-to-peer marketplaces (e.g., Facebook Marketplace, OfferUp, Craigslist, Buy Nothing groups).
  - Usable furniture and working appliances can also be donated to local charity thrift organizations (Habitat ReStore, Goodwill, Salvation Army) which often offer free home pickup.
* Non-working / Broken Bulky Items (destination: "dropoff", binLabel: "Bulky Drop-Off Required"):
  - Mattresses & Box Springs (destination: "dropoff", binLabel: "Miramar Drop-Off (Free)"): Under the California Bye Bye Mattress program, California residents can drop off up to 4 clean, dry mattresses and box springs for FREE at the Miramar Recycling Center (5165 Convoy St, Mon–Fri 7am–4pm, Sat 7am–4:30pm). No appointment required. Never put in Black Cart.
  - Broken/unusable furniture & appliances: Self-haul to the Miramar Landfill (5161 Convoy St — self-haul refuse fee applies; scrap metal/appliances recycled) or hire a licensed private hauler.

Return ONLY a JSON object with keys: itemTitle (string), destination ("blue" | "green" | "black" | "dropoff"), binLabel (string), ruleHeadline (string), explanation (string), nuanceNote (string, optional), citation (string).`;

interface RuleEntry {
  keywords: RegExp;
  itemTitle: string;
  destination: BinDestination;
  binLabel: string;
  ruleHeadline: string;
  explanation: string;
  nuanceNote?: string;
  citation: string;
}

const ESD_RULES: readonly RuleEntry[] = [
  // E. Mattresses & Box Springs (Free at Miramar Recycling Center)
  {
    keywords:
      /\b(mattress(es)?|box ?springs?|futon mattress|crib mattress)\b/i,
    itemTitle: "Mattresses & Box Springs",
    destination: "dropoff",
    binLabel: "Miramar Drop-Off (Free)",
    ruleHeadline: "Free Drop-Off at Miramar Recycling Center",
    explanation:
      "The City of San Diego paused curbside bulky pickup. Leaving mattresses curbside is enforced as illegal dumping. California residents can drop off up to 4 mattresses or box springs for FREE at the Miramar Recycling Center under the Bye Bye Mattress program.",
    nuanceNote:
      "Miramar Recycling Center (5165 Convoy St · Mon–Fri 7am–4pm, Sat 7am–4:30pm, no appointment needed under the Bye Bye Mattress program). Never place in curbside carts.",
    citation:
      "City of San Diego ESD Bulky Waste Program & California Mattress Recycling Council",
  },
  // E. Bulky Furniture & Appliances (Resell / Upcycle / Thrift / Self-Haul to Miramar Landfill)
  {
    keywords:
      /\b(bulky|furniture|couch(es)?|sofas?|armchairs?|recliners?|dressers?|bookcases?|desks?|tables?|chairs?|appliances?|refrigerators?|fridges?|freezers?|stoves?|ovens?|washers?|dryers?|dishwashers?|water heaters?|nightstands?|bed frames?|cabinets?)\b/i,
    itemTitle: "Bulky Furniture & Large Appliances",
    destination: "dropoff",
    binLabel: "Resell / Donate / Drop-Off",
    ruleHeadline: "Deflect from Landfill: Resell, Thrift, or Self-Haul",
    explanation:
      "Curbside bulky pickup was paused by the City of San Diego, and curb disposal is illegal dumping. Deflect from the landfill by reselling on Facebook Marketplace or OfferUp, or donating to local thrift charities (Habitat ReStore, Goodwill). Non-working items must be self-hauled to Miramar Landfill.",
    nuanceNote:
      "Encourage landfill deflection: sell or give away on Facebook Marketplace, OfferUp, or Buy Nothing groups. Donate usable goods to charity thrift stores (many offer free pickup). Non-reusable bulky items require self-hauling to the Miramar Landfill (5161 Convoy St).",
    citation: "City of San Diego ESD Bulky Waste Regulations & Zero Waste Guidelines",
  },

  // D. Special Drop-Off Required (Hazardous Waste & E-Waste)
  {
    keywords:
      /\b(batter(y|ies)|lithium|aa\b|aaa\b|9v\b|button cell|rechargeable|power bank)\b/i,
    itemTitle: "Batteries (All Types & Lithium-Ion)",
    destination: "dropoff",
    binLabel: "Hazardous Waste",
    ruleHeadline: "Facility Drop-Off Required",
    explanation:
      "Illegal under California state law in Black, Blue, or Green carts. Lithium and household batteries spark truck and landfill fires.",
    nuanceNote:
      "Drop off at the Miramar Hazardous Waste Transfer Facility (5161 Convoy St · 858-694-7000 by appointment) or at a City Saturday pop-up collection event.",
    citation: "California State Hazardous Waste Law & City of San Diego ESD Guide",
  },
  {
    keywords:
      /\b(e-?waste|electronics?|cell ?phones?|iphones?|smartphones?|laptops?|computers?|monitors?|televisions?|\btvs?\b|tablets?|printers?|circuit boards?)\b/i,
    itemTitle: "Electronics & E-Waste",
    destination: "dropoff",
    binLabel: "Hazardous Waste (E-Waste)",
    ruleHeadline: "Facility Drop-Off Required",
    explanation:
      "Phones, computers, monitors, and TVs are banned from all residential curbside carts under California law.",
    nuanceNote:
      "Take to Miramar Recycling Center / Hazardous Waste Facility (5161 Convoy St · 858-694-7000).",
    citation: "California Electronic Waste Recycling Act & San Diego ESD",
  },
  {
    keywords:
      /\b(motor oil|oil filters?|paints?|pesticides?|chemicals?|cleaners?|bleach|solvents?|fluorescent|led bulbs?|light ?bulbs?|compact fluorescent|cfls?)\b/i,
    itemTitle: "Paint, Chemicals, Oil & Bulbs",
    destination: "dropoff",
    binLabel: "Hazardous Waste",
    ruleHeadline: "Facility Drop-Off Required",
    explanation:
      "Motor oil, oil filters, paint, pesticides, household cleaners, fluorescent tubes, and LED bulbs cannot go in any curbside bin.",
    nuanceNote:
      "Schedule a free appointment at the Miramar Hazardous Waste Transfer Facility: 5161 Convoy St, San Diego, CA 92111 (858-694-7000). Motor oil, filters, and bulbs are also accepted at Saturday pop-up events.",
    citation: "City of San Diego ESD Hazardous Waste Program",
  },

  // B / C. Pet Waste & Cat Litter (checked before bioplastics so "dog poop in biodegradable bag" hits pet waste + bioplastic rule)
  {
    keywords:
      /\b(pet waste|dog poop|dog waste|cat litter|kitty litter|feces|poop|animal waste)\b/i,
    itemTitle: "Pet Waste & Cat Litter",
    destination: "black",
    binLabel: "Black Cart · Trash",
    ruleHeadline: "Strictly Prohibited in Green Cart",
    explanation:
      "Dog and cat feces and cat litter are banned from the Green Cart due to dangerous pathogen contamination.",
    nuanceNote:
      "Bag securely and place in the Black Cart (Trash). Even if bagged in a “biodegradable” bag, it must go in the Black Cart.",
    citation: "Miramar Greenery Composting Regulations",
  },

  // B / C. Critical San Diego Bioplastics Rule (PLA / "Compostable" plastics -> Black Cart)
  {
    keywords:
      /\b(compostable|biodegradable|bioplastics?|\bpla\b).*(cups?|bags?|utensils?|cutlery|forks?|spoons?|knives|knife|containers?|straws?|lids?|plates?)|(cups?|bags?|utensils?|cutlery|forks?|spoons?|knives|knife|containers?|straws?|lids?|plates?).*(compostable|biodegradable|bioplastics?|\bpla\b)|\b(compostable|biodegradable|bioplastics?|\bpla\b)\b/i,
    itemTitle: "“Compostable” / PLA Bioplastics",
    destination: "black",
    binLabel: "Black Cart · Trash",
    ruleHeadline: "Not Accepted at Miramar Greenery",
    explanation:
      "The City of San Diego Miramar Greenery DOES NOT accept “compostable” or “biodegradable” plastic bags, cups, containers, or PLA cutlery.",
    nuanceNote:
      "Processing equipment cannot distinguish bioplastics from petroleum plastic and they do not break down fast enough in municipal compost windrows.",
    citation: "Miramar Greenery Composting Regulations & SB 1383",
  },

  // A / B. Pizza Box Dilemma (Greasy bottom -> Green, Clean top -> Blue)
  {
    keywords: /\b(pizza|pizza box|pizza boxes)\b/i,
    itemTitle: "Pizza Boxes (Tear Apart)",
    destination: "green",
    binLabel: "Green Cart (Greasy) · Blue Cart (Clean Top)",
    ruleHeadline: "Split Greasy Bottom from Clean Top",
    explanation:
      "Tear the box in half: put the greasy, food-soiled bottom in the Green Cart (Organics) and the clean cardboard lid (flattened) in the Blue Cart (Recycling).",
    nuanceNote:
      "Never leave leftover crust or liners inside the Blue Cart half.",
    citation:
      "City of San Diego ESD Curbside Recycling Guide & Miramar Greenery",
  },

  // A. Plastic Bottle & Jar Caps (San Diego specific rule: screw on tightly)
  {
    keywords: /\b(bottle caps?|jar caps?|plastic caps?|plastic lids?|caps?)\b/i,
    itemTitle: "Plastic Bottle & Jar Caps",
    destination: "blue",
    binLabel: "Blue Cart · Recycling",
    ruleHeadline: "Screw Cap Tightly Onto Bottle",
    explanation:
      "Empty and rinse the plastic bottle or jar, let it dry, and screw the plastic cap back on tightly before placing in the Blue Cart.",
    nuanceNote:
      "San Diego MRF Rule: Loose plastic caps fall through sorting grates at the Material Recovery Facility—always attach them to the bottle.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // A / B. Shredded Paper
  {
    keywords: /\b(shredded paper|paper shreds)\b/i,
    itemTitle: "Shredded Paper",
    destination: "green",
    binLabel: "Green Cart (or Secured Paper Bag in Blue)",
    ruleHeadline: "Never Place Loose in Blue Cart",
    explanation:
      "Never put loose shredded paper in the Blue Cart. Place it in the Green Cart (Organics) or seal it inside a closed paper bag if placing in the Blue Cart.",
    nuanceNote:
      "Loose paper shreds scatter across the sorting line and contaminate glass and plastic streams.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // A / C. Tanglers (Plastic bags, film, hoses, cords, holiday lights)
  {
    keywords:
      /\b(plastic bags?|shopping bags?|grocery bags?|plastic wrap|bubble wrap|stretch film|cling wrap|ziplocs?|film plastics?)\b/i,
    itemTitle: "Plastic Bags, Wrap & Film (“Tanglers”)",
    destination: "black",
    binLabel: "Black Cart · Trash (or Grocery Drop-Off)",
    ruleHeadline: "Strictly Forbidden in Blue & Green Carts",
    explanation:
      "Plastic shopping bags, bubble wrap, and stretch film wrap around spinning sorting disks at the Allan Company recycling center.",
    nuanceNote:
      "Return clean, dry plastic bags and film to retail grocery store drop-off bins, or place in the Black Cart (Trash). Never bag recyclables or organics in plastic.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },
  {
    keywords:
      /\b(garden hoses?|hoses?|electrical cords?|extension cords?|holiday lights?|christmas lights?|string lights?|wires?|cables?)\b/i,
    itemTitle: "Hoses, Cords, Wires & Holiday Lights",
    destination: "black",
    binLabel: "Black Cart · Trash",
    ruleHeadline: "Prohibited MRF Tangler",
    explanation:
      "Garden hoses, cords, wires, and holiday lights are major tanglers that jam sorting machinery at the Allan Company recycling facility.",
    nuanceNote:
      "Never place in the Blue or Green cart. Dispose of hoses in the Black Cart (or take electrical cords/lights to e-waste drop-off).",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // A / C. Broken Glass, Window Panes, Mirrors & Ceramics
  {
    keywords:
      /\b(broken glass|window panes?|mirrors?|ceramics?|mugs?|porcelain|dishware|pyrex|drinking glass)\b/i,
    itemTitle: "Broken Glass, Mirrors & Ceramics",
    destination: "black",
    binLabel: "Black Cart · Trash",
    ruleHeadline: "Not Recyclable Curbside",
    explanation:
      "Broken glass, window panes, mirrors, and ceramics have different melting points than bottle glass and pose safety hazards to sorters.",
    nuanceNote:
      "Wrap sharp pieces securely in paper or cardboard before placing in the Black Cart.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // B / C. Treated Wood, Dirt & Rocks
  {
    keywords:
      /\b(treated wood|painted wood|lumber|dirt|soil|rocks?|stones?|gravel|concrete)\b/i,
    itemTitle: "Treated Wood, Dirt & Rocks",
    destination: "black",
    binLabel: "Black Cart · Trash",
    ruleHeadline: "Forbidden in Green Cart",
    explanation:
      "Treated or painted wood, dirt, rocks, and gravel damage Miramar Greenery grinders and contaminate finished compost.",
    citation: "Miramar Greenery Composting Regulations",
  },

  // B / C. Tree Stumps, Logs & Oversized Wood (Exceeds 6" diameter or 4' length limit)
  {
    keywords:
      /\b(tree stumps?|stumps?|oversized branches?|thick branches?|large branches?|tree logs?|logs?|tree trunks?|firewood)\b/i,
    itemTitle: "Tree Stumps, Logs & Oversized Wood",
    destination: "black",
    binLabel: "Black Cart · Trash (or Miramar Landfill)",
    ruleHeadline: "Exceeds 6″ Diameter / 4-Foot Organics Limit",
    explanation:
      "The City of San Diego strictly limits Green Cart yard trimmings to branches under 4 feet long and under 6 inches in diameter. Tree stumps, heavy logs, and thick branches jam industrial tub grinders at the Miramar Greenery.",
    nuanceNote:
      "If a branch is cut down to under 4 ft in length and under 6 in diameter, it belongs in the Green Cart. Stumps and oversized logs must be hauled directly to the Miramar Landfill wood drop-off or disposed of as trash.",
    citation: "Miramar Greenery Composting Regulations & San Diego ESD Yard Waste Rules",
  },

  // C. Packing Peanuts (Foam vs. Cornstarch)
  {
    keywords:
      /\b(packing peanuts?|foam peanuts?|shipping peanuts?)\b|\bpeanuts?\s+(?:packing|foam|shipping)\b/i,
    itemTitle: "Packing Peanuts",
    destination: "black",
    binLabel: "Black Cart · Trash (or Reuse Drop-Off)",
    ruleHeadline: "Non-Recyclable Curbside Foam",
    explanation:
      "Polystyrene foam packing peanuts cannot be recycled in the Blue Cart (they scatter and jam MRF sorting disks) and cannot be composted. Dispose of them in the Black Cart.",
    nuanceNote:
      "Water test: If a peanut dissolves under warm water, it is made of plant cornstarch and can be dissolved in the sink. Clean foam peanuts are accepted for reuse at many local UPS and packaging stores.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // A / C. Wrapping Paper
  {
    keywords: /\b(wrapping paper|gift wrap|holiday wrap|christmas wrap)\b/i,
    itemTitle: "Wrapping Paper & Gift Wrap",
    destination: "blue",
    binLabel: "Blue Cart (Plain Paper) · Black Cart (Foil/Glitter)",
    ruleHeadline: "Only 100% Plain Paper Is Recyclable",
    explanation:
      "Plain paper gift wrap goes in the Blue Cart. Metallic, foil, plastic-coated, or glitter-covered wrapping paper cannot be recycled and must go in the Black Cart (Trash).",
    nuanceNote:
      "Tear test: If it tears easily like newspaper, recycle in Blue Cart. Always remove ribbons, bows, and sticky tape before disposal.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // C. Black Cart Landfill items (Styrofoam, utensils, wrappers, diapers, wipes, waxed cardboard)
  {
    keywords:
      /\b(styrofoam|polystyrene|foam cups?|foam trays?|plastic utensils?|plastic forks?|plastic spoons?|plastic straws?|straws?|chip bags?|snack wrappers?|candy wrappers?|pet food bags?|diapers?|wipes?|sanitation wipes?|baby wipes?|waxed cardboard)\b/i,
    itemTitle: "Single-Use Disposables & Foam",
    destination: "black",
    binLabel: "Black Cart · Trash",
    ruleHeadline: "Landfill Only",
    explanation:
      "Styrofoam, plastic utensils/straws, chip bags, snack wrappers, pet food bags, diapers, wipes, and waxed cardboard cannot be recycled or composted in San Diego.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // A / C. Food-Soiled Aluminum Foil
  {
    keywords:
      /\b(foil with food|food on.*foil|foil.*food on|dirty (?:aluminum )?foil|greasy (?:aluminum )?foil|soiled (?:aluminum )?foil|used foil with cheese|baked.*foil)\b/i,
    itemTitle: "Food-Soiled Aluminum Foil",
    destination: "black",
    binLabel: "Black Cart · Trash",
    ruleHeadline: "Non-Recyclable Due to Contamination",
    explanation:
      "Aluminum foil or foil trays contaminated with food residue, grease, or baked-on food cannot be recycled in the Blue Cart (which requires items to be empty, clean, and dry) and cannot go in the Green Cart. Dispose in the Black Cart (Trash).",
    nuanceNote:
      "Only clean, rinsed aluminum foil (balled up to at least 2 inches) belongs in the Blue Cart.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // A. Aluminum Foil & Cans / Metals
  {
    keywords:
      /\b(aluminum foil|foil trays?|tin foil|aluminum cans?|soda cans?|steel cans?|tin cans?|soup cans?|metal cans?)\b/i,
    itemTitle: "Cans & Clean Balled Aluminum Foil",
    destination: "blue",
    binLabel: "Blue Cart · Recycling",
    ruleHeadline: "Empty, Clean, and Dry",
    explanation:
      "Aluminum cans, rinsed tin/steel food cans, and clean aluminum foil or foil trays go in the Blue Cart.",
    nuanceNote:
      "Ball up clean aluminum foil to at least a 2-inch sphere so it does not flatten out like paper on the MRF sorting line.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // A. Rigid Plastics, Cardboard, Paper, Cartons, Glass Bottles, Jars (placed before general food so "peanut butter jar" matches container)
  {
    keywords:
      /\b(peanut butter jars?|jelly jars?|mayo(?:nnaise)? jars?|condiment jars?|glass jars?|plastic jars?|food jars?|empty jars?|\bjars?\b|plastic bottles?|water bottles?|soda bottles?|detergent jugs?|yogurt tubs?|butter tubs?|cardboard|cereal box|cereal boxes|office paper|magazines?|paper bags?|egg cartons?|milk cartons?|juice cartons?|glass bottles?|wine bottles?|beer bottles?)\b/i,
    itemTitle: "Clean Recyclable Containers & Paper",
    destination: "blue",
    binLabel: "Blue Cart · Recycling",
    ruleHeadline: "Empty, Clean, and Dry",
    explanation:
      "Rigid plastics (#1–#7), jars (including peanut butter and condiment jars), flattened cardboard, paper, cartons, and glass bottles belong in the Blue Cart once empty, rinsed, and dry.",
    nuanceNote:
      "Keep plastic caps screwed on tightly to empty plastic bottles and jars. Scrape out remaining food residue (like peanut butter) before recycling. Never bag recyclables in plastic bags.",
    citation: "City of San Diego ESD Curbside Recycling Guide",
  },

  // B. Green Bin (Food scraps, meat, bones, dairy, coffee grounds, soiled paper, yard trimmings)
  {
    keywords:
      /\b(food|meat|chicken|poultry|fish|bones?|shells?|egg ?shells?|dairy|cheese|butter|peanut butter|peanuts?|fruits?|vegetables?|peels?|coffee|coffee grounds?|coffee filters?|tea bags?|tea leafs?|tea leaves|napkins?|paper towels?|paper plates?|yard|leaf|leaves|grass|weeds?|branch|branches|tree trimmings?|trimmings?|compost|organics?)\b/i,
    itemTitle: "Food Scraps, Soiled Paper & Yard Trimmings",
    destination: "green",
    binLabel: "Green Cart · Organics",
    ruleHeadline: "Miramar Greenery Feedstock (SB 1383)",
    explanation:
      "All food scraps (including peanut butter, nuts, meat, bones, dairy, coffee grounds/paper filters), uncoated food-soiled paper (napkins, paper towels), and yard trimmings (under 4 ft long & under 6 in diameter) go in the Green Cart.",
    nuanceNote:
      "Place loose in the Green Cart or wrap in newspaper/paper bags—never use plastic or “compostable” bioplastic bags.",
    citation: "Miramar Greenery Composting Regulations & California SB 1383",
  },
];

/**
 * Classifies any household waste query against the Official City of San Diego
 * ESD Knowledge Base (Section 2.4).
 */
export function classifyWasteItem(rawQuery: string): SortingVerdict {
  const query = rawQuery.trim();
  for (const rule of ESD_RULES) {
    if (rule.keywords.test(query)) {
      return {
        query,
        itemTitle: rule.itemTitle,
        destination: rule.destination,
        binLabel: rule.binLabel,
        ruleHeadline: rule.ruleHeadline,
        explanation: rule.explanation,
        nuanceNote: rule.nuanceNote,
        citation: rule.citation,
      };
    }
  }

  return {
    query,
    itemTitle: query ? `“${query}”` : "Unidentified Item",
    destination: "black",
    binLabel: "Black Cart · Trash",
    ruleHeadline: "Non-Recyclable & Non-Compostable Item",
    explanation:
      "This item does not meet the City's strict standards for empty, clean & dry recyclables (Blue Cart) or organic compost feedstock (Green Cart). Place it in the Black Cart to prevent stream contamination.",
    nuanceNote:
      "Never place batteries, electronics, or household hazardous chemicals in any curbside cart—take them to the Miramar Hazardous Waste Transfer Facility (5161 Convoy St · 858-694-7000).",
    citation:
      "City of San Diego ESD Curbside Recycling Guide & Miramar Greenery Regulations",
  };
}

const VALID_DESTINATIONS: readonly BinDestination[] = [
  "blue",
  "green",
  "black",
  "dropoff",
];

function isValidVerdict(
  value: unknown
): value is Omit<SortingVerdict, "query"> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.itemTitle === "string" &&
    typeof candidate.destination === "string" &&
    (VALID_DESTINATIONS as readonly string[]).includes(
      candidate.destination as BinDestination
    ) &&
    typeof candidate.binLabel === "string" &&
    typeof candidate.ruleHeadline === "string" &&
    typeof candidate.explanation === "string" &&
    typeof candidate.citation === "string"
  );
}

/**
 * Calls Google Gemini (`gemini-2.5-flash`) with `ESD_SORTING_SYSTEM_PROMPT`
 * and returns both the structured `SortingVerdict` and token/latency telemetry.
 */
export interface GeminiSorterResult {
  verdict: SortingVerdict;
  telemetry: SortingTelemetry;
  quotaExceeded?: boolean;
}

export async function queryGeminiSorter(
  query: string,
  apiKey = process.env.GEMINI_API_KEY
): Promise<{ verdict: SortingVerdict; telemetry: SortingTelemetry; quotaExceeded?: boolean } | null> {
  if (!apiKey) return null;
  const startedAt = Date.now();
  const model = "gemini-3.8-flash";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: ESD_SORTING_SYSTEM_PROMPT }],
          },
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
        signal: AbortSignal.timeout(8000),
      }
    );

    if (res.status === 429) {
      // Rate limit / daily free-tier quota hit
      return {
        verdict: classifyWasteItem(query),
        telemetry: {
          source: "rules",
          latencyMs: Date.now() - startedAt,
        },
        quotaExceeded: true,
      };
    }

    if (!res.ok) return null;

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed: unknown = JSON.parse(rawText);
    if (!isValidVerdict(parsed)) return null;

    const latencyMs = Date.now() - startedAt;
    return {
      verdict: { query, ...parsed },
      telemetry: {
        source: "gemini",
        model,
        latencyMs,
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount ?? 0,
              candidateTokens: data.usageMetadata.candidatesTokenCount ?? 0,
              totalTokens: data.usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
      },
      quotaExceeded: false,
    };
  } catch {
    return null;
  }
}

/**
 * Golden Evaluation Benchmark Suite for the San Diego ESD Sorter.
 * Covers standard items, San Diego-specific MRF/Miramar Greenery nuances,
 * and adversarial resident dilemmas.
 */
export interface EsdEvalCase {
  id: string;
  query: string;
  category: string;
  expectedDestination: BinDestination;
  /** Regex that MUST match the combined explanation + nuanceNote + ruleHeadline. */
  requiredConcept: RegExp;
  /** Optional regex that MUST NOT match (e.g., claiming PLA goes in green bin). */
  forbiddenConcept?: RegExp;
}

export interface EsdEvalResult {
  testCase: EsdEvalCase;
  verdict: SortingVerdict;
  passed: boolean;
  destinationMatched: boolean;
  conceptMatched: boolean;
  forbiddenAvoided: boolean;
  citationPresent: boolean;
  failureReasons: string[];
}

export const ESD_EVAL_SUITE: readonly EsdEvalCase[] = [
  {
    id: "sd-nuance-bottle-caps",
    query: "plastic water bottle cap",
    category: "San Diego Nuance · MRF Grates",
    expectedDestination: "blue",
    requiredConcept: /screw|attach|tight|on.*bottle/i,
  },
  {
    id: "sd-nuance-pla-cup",
    query: "compostable PLA plastic cold cup",
    category: "San Diego Nuance · Miramar Greenery Bioplastics Ban",
    expectedDestination: "black",
    requiredConcept: /miramar|not accept|bioplastic|pla|windrow/i,
  },
  {
    id: "sd-nuance-biodegradable-fork",
    query: "biodegradable plant-based fork",
    category: "San Diego Nuance · Miramar Greenery Bioplastics Ban",
    expectedDestination: "black",
    requiredConcept: /miramar|not accept|bioplastic|cutlery|trash/i,
  },
  {
    id: "sd-nuance-pizza-box",
    query: "greasy pizza box",
    category: "San Diego Nuance · Split Box Rule",
    expectedDestination: "green",
    requiredConcept: /greasy|top|blue/i,
  },
  {
    id: "sd-nuance-shredded-paper",
    query: "shredded paper",
    category: "San Diego Nuance · Paper Shreds",
    expectedDestination: "green",
    requiredConcept: /loose|paper bag|green/i,
  },
  {
    id: "tangler-plastic-grocery-bag",
    query: "plastic shopping bag",
    category: "MRF Tangler Prohibition",
    expectedDestination: "black",
    requiredConcept: /allan company|wrap|spinning|grocery|drop-off|tangler/i,
  },
  {
    id: "tangler-garden-hose",
    query: "broken garden hose",
    category: "MRF Tangler Prohibition",
    expectedDestination: "black",
    requiredConcept: /tangler|allan company|machinery|forbidden|trash/i,
  },
  {
    id: "tangler-holiday-lights",
    query: "tangled christmas string lights",
    category: "MRF Tangler Prohibition",
    expectedDestination: "black",
    requiredConcept: /tangler|allan company|e-waste|trash/i,
  },
  {
    id: "prohibited-pet-waste",
    query: "dog poop in a biodegradable bag",
    category: "Pathogen Contamination Prohibition",
    expectedDestination: "black",
    requiredConcept: /pathogen|prohibited|banned|trash/i,
  },
  {
    id: "prohibited-cat-litter",
    query: "used cat litter",
    category: "Pathogen Contamination Prohibition",
    expectedDestination: "black",
    requiredConcept: /pathogen|prohibited|banned|trash/i,
  },
  {
    id: "prohibited-broken-ceramic-mug",
    query: "broken ceramic coffee mug",
    category: "Non-Recyclable Glass/Ceramics",
    expectedDestination: "black",
    requiredConcept: /ceramic|not recyclable|trash|wrap/i,
  },
  {
    id: "hhw-lithium-battery",
    query: "swollen lithium-ion battery",
    category: "HHW & Fire Hazard",
    expectedDestination: "dropoff",
    requiredConcept: /5161 convoy|858-694-7000|fire|miramar/i,
  },
  {
    id: "hhw-aa-batteries",
    query: "dead AA alkaline batteries",
    category: "HHW & Fire Hazard",
    expectedDestination: "dropoff",
    requiredConcept: /5161 convoy|858-694-7000|illegal|miramar/i,
  },
  {
    id: "ewaste-television",
    query: "broken flat screen television",
    category: "E-Waste Drop-Off",
    expectedDestination: "dropoff",
    requiredConcept: /5161 convoy|858-694-7000|miramar/i,
  },
  {
    id: "hhw-motor-oil",
    query: "used motor oil and oil filter",
    category: "HHW Chemicals & Liquids",
    expectedDestination: "dropoff",
    requiredConcept: /5161 convoy|858-694-7000|miramar/i,
  },
  {
    id: "hhw-led-bulb",
    query: "burned out fluorescent tube and LED bulb",
    category: "HHW Bulbs",
    expectedDestination: "dropoff",
    requiredConcept: /5161 convoy|858-694-7000|miramar/i,
  },
  {
    id: "blue-aluminum-foil",
    query: "clean aluminum foil",
    category: "Blue Cart Metals",
    expectedDestination: "blue",
    requiredConcept: /ball|clean|empty/i,
  },
  {
    id: "blue-yogurt-tub",
    query: "rinsed plastic yogurt tub",
    category: "Blue Cart Rigid Plastics",
    expectedDestination: "blue",
    requiredConcept: /empty|clean|dry|rigid/i,
  },
  {
    id: "green-chicken-bones",
    query: "cooked chicken bones and meat scraps",
    category: "Green Cart SB 1383 Organics",
    expectedDestination: "green",
    requiredConcept: /food|meat|bone|miramar|sb 1383/i,
  },
  {
    id: "black-styrofoam",
    query: "styrofoam takeout container and plastic straw",
    category: "Black Cart Landfill",
    expectedDestination: "black",
    requiredConcept: /styrofoam|polystyrene|straw|landfill|cannot be recycled/i,
  },
];

export function evaluateSortingVerdict(
  testCase: EsdEvalCase,
  verdict: SortingVerdict
): EsdEvalResult {
  const combinedText = [
    verdict.itemTitle,
    verdict.binLabel,
    verdict.ruleHeadline,
    verdict.explanation,
    verdict.nuanceNote ?? "",
    verdict.citation,
  ].join(" ");

  const destinationMatched =
    verdict.destination === testCase.expectedDestination;
  const conceptMatched = testCase.requiredConcept.test(combinedText);
  const forbiddenAvoided = testCase.forbiddenConcept
    ? !testCase.forbiddenConcept.test(combinedText)
    : true;
  const citationPresent = verdict.citation.trim().length > 5;

  const failureReasons: string[] = [];
  if (!destinationMatched) {
    failureReasons.push(
      `Expected destination "${testCase.expectedDestination}", got "${verdict.destination}"`
    );
  }
  if (!conceptMatched) {
    failureReasons.push(
      `Missing required ESD concept matching ${testCase.requiredConcept.toString()}`
    );
  }
  if (!forbiddenAvoided) {
    failureReasons.push(
      `Contained forbidden concept matching ${testCase.forbiddenConcept?.toString()}`
    );
  }
  if (!citationPresent) {
    failureReasons.push("Missing official ESD source citation");
  }

  return {
    testCase,
    verdict,
    passed:
      destinationMatched &&
      conceptMatched &&
      forbiddenAvoided &&
      citationPresent,
    destinationMatched,
    conceptMatched,
    forbiddenAvoided,
    citationPresent,
    failureReasons,
  };
}

export interface ConditionalPivot {
  condition: string;
  alternateDestination: BinDestination;
  alternateLabel: string;
  advice: string;
}

export function getQuickWhy(verdict: SortingVerdict): string {
  const text = `${verdict.query} ${verdict.itemTitle} ${verdict.ruleHeadline}`.toLowerCase();

  if (/mattress|box ?spring/i.test(text)) {
    return "Curbside bulky pickup is paused, but California residents can drop off up to 4 mattresses and box springs for free at the Miramar Recycling Center under the Bye Bye Mattress program.";
  }
  if (/furniture|couch|sofa|chair|desk|table|appliance|refrigerator|stove|washer|dryer|bulky|dresser|bookcase|nightstand/i.test(text)) {
    return "Curbside bulky pickup is paused, but you can deflect items from the landfill by reselling on Facebook Marketplace or OfferUp, donating to local charities, or self-hauling non-working goods to Miramar.";
  }
  if (/pizza/i.test(text)) {
    return "Grease and food oils contaminate paper recycling fibers at the MRF, but Miramar Greenery converts food-soiled cardboard into rich compost.";
  }
  if (/meat|bone|poultry|chicken|beef|pork|fish|seafood/i.test(text)) {
    return "Under California SB 1383, Miramar Greenery industrial composting safely processes all animal proteins, bones, and dairy without pests.";
  }
  if (/\b(packing|foam|shipping)\s+peanuts?\b|\bpeanuts?\s+(?:packing|foam|shipping)\b/i.test(text)) {
    return "Polystyrene foam breaks into static beads that jam sorting screens at Allan Co. and never break down in municipal compost windrows.";
  }
  if (/wrapping paper|gift wrap/i.test(text)) {
    return "Metallic foils, glitter, and plastic coatings contaminate pulping vats at paper recycling mills.";
  }
  if (/foil/i.test(text)) {
    if (verdict.destination === "black") {
      return "Baked-on food grease burns and ruins aluminum remelting batches, and metal cannot break down in organics compost.";
    }
    return "Clean aluminum is infinitely recyclable, but must be balled up to at least 2 inches so sorting disks don't mistake it for paper.";
  }
  if (/caps?|lids?/i.test(text)) {
    return "Loose caps under 2 inches fall through sorting grates into trash, but screwing them on tightly keeps them in the recycling stream.";
  }
  if (/batter|electronics|laptop|phone|oil/i.test(text)) {
    return "Lithium and hazardous batteries cause catastrophic fires in collection trucks and recycling facilities, and are illegal in curbside carts.";
  }
  if (/\b(shredded paper|paper shreds|\bshreds?\b)\b/i.test(text)) {
    return "Loose paper shreds scatter across recycling conveyor belts and fall through MRF sorting screens into the trash, but decompose into rich compost at the Miramar Greenery.";
  }
  if (/compostable.*plastic|\bpla\b|biodegradable.*plastic/i.test(text)) {
    return "Miramar Greenery processing equipment cannot differentiate bioplastics from petroleum plastic and windrows don't reach high enough temperatures to melt PLA.";
  }
  if (/dog|cat|feces|litter|pet waste/i.test(text)) {
    return "Fecal pathogens like toxoplasmosis survive municipal composting and contaminate organic compost used on crops and gardens.";
  }
  if (/bag|film|wrap|hose|cord|light/i.test(text)) {
    return "Plastic films and cords are tanglers that wrap tightly around high-speed spinning disks at the Allan Company recycling center.";
  }

  // Fallback: extract the first complete sentence from explanation
  const firstSentence = verdict.explanation.split(/(?<=[.!?])\s+/)[0];
  return firstSentence || verdict.explanation;
}

export function getActionableSteps(verdict: SortingVerdict): string[] {
  const text = `${verdict.query} ${verdict.itemTitle}`.toLowerCase();

  if (/mattress|box ?spring/i.test(text)) {
    return [
      "Do not leave at the curb — curbside bulky collection is paused",
      "Transport to Miramar Recycling Center (5165 Convoy St · No appointment needed)",
      "Drop off for free under the California Bye Bye Mattress program (up to 4 units)",
    ];
  }
  if (/furniture|couch|sofa|chair|desk|table|appliance|refrigerator|stove|washer|dryer|bulky|dresser|bookcase|nightstand/i.test(text)) {
    return [
      "Deflect from landfill: Resell or give away on Facebook Marketplace, OfferUp, or Buy Nothing",
      "Donate working appliances or usable furniture to local charities (e.g., Habitat ReStore, Goodwill)",
      "Do not leave at the curb (strictly enforced as illegal dumping)",
      "If broken/unusable, self-haul to the Miramar Landfill (5161 Convoy St)",
    ];
  }

  if (/pizza/i.test(text)) {
    return [
      "Tear box in half along the hinge",
      "Place greasy, food-soiled bottom in Green Cart (Organics)",
      "Flatten clean cardboard lid for Blue Cart (Recycling)",
    ];
  }
  if (/foil/i.test(text)) {
    if (verdict.destination === "black") {
      return [
        "Check if food residue or grease can be wiped or rinsed off",
        "If clean, ball up tightly to 2\"+ and place in Blue Cart",
        "If food is baked-on or greasy, dispose in Black Cart (Trash)",
      ];
    }
    return [
      "Rinse free of all food residue and grease",
      "Scrunch together into a tight ball at least 2 inches in diameter",
      "Place clean foil ball in Blue Cart (Recycling)",
    ];
  }
  if (/meat|bone|poultry|chicken|beef|pork|fish|seafood/i.test(text)) {
    return [
      "Collect food scraps, cooked or raw bones, and meat plate scrapings",
      "Wrap inside a paper napkin, paper bag, or place loose in kitchen pail",
      "Empty into Green Cart (no plastic or bioplastic PLA bags allowed)",
    ];
  }
  if (/\b(packing|foam|shipping)\s+peanuts?\b|\bpeanuts?\s+(?:packing|foam|shipping)\b/i.test(text)) {
    return [
      "Perform water test: hold peanut under warm faucet",
      "If it dissolves instantly, wash starch down the sink",
      "If polystyrene foam, bag tightly for Black Cart or drop off at local shipping store for reuse",
    ];
  }
  if (/wrapping paper|gift wrap/i.test(text)) {
    return [
      "Perform tear test: check if it tears easily like newsprint",
      "Remove all ribbons, bows, and sticky tape (place in Black Cart)",
      "Recycle plain paper in Blue Cart (dispose of foil/glitter wrap in Black Cart)",
    ];
  }
  if (/caps?|lids?/i.test(text)) {
    return [
      "Empty and rinse plastic bottle or condiment jar",
      "Screw the plastic cap back on tightly to the neck",
      "Place attached bottle and cap into Blue Cart (Recycling)",
    ];
  }
  if (/batter|electronics|laptop|phone|oil/i.test(text)) {
    return [
      "Tape battery terminals with clear tape to prevent short circuits",
      "Never place in Black, Blue, or Green curbside carts",
      "Drop off at Miramar HHW Transfer Facility (5161 Convoy St · 858-694-7000)",
    ];
  }
  if (/shred/i.test(text)) {
    return [
      "Never place loose shredded paper in Blue Cart",
      "Place loose paper shreds in Green Cart (Organics), OR",
      "Seal inside a brown paper bag before placing in Blue Cart",
    ];
  }
  if (/compostable.*plastic|pla/i.test(text)) {
    return [
      "Check label for PLA or #7 bioplastic",
      "Do not place in Green Cart or Blue Cart",
      "Dispose in Black Cart (Trash)",
    ];
  }

  // Destination-based standard steps
  if (verdict.destination === "blue") {
    return [
      "Empty, rinse, and let dry before disposal",
      "Keep loose—never bag recyclables in plastic bags",
      "Place into Blue Cart (Recycling)",
    ];
  }
  if (verdict.destination === "green") {
    return [
      "Ensure item is free of plastic bags, stickers, and metal ties",
      "Place directly into Green Cart or wrap in uncoated paper",
      "Keep lid closed to preserve compost feedstock quality",
    ];
  }
  if (verdict.destination === "dropoff") {
    return [
      "Store safely in a cool, dry area away from heat sources",
      "Never mix hazardous materials into household curbside carts",
      "Bring to City of San Diego HHW Facility (5161 Convoy St)",
    ];
  }

  return [
    "Check if item can be reused, repaired, or donated locally",
    "Bag securely to prevent litter and odor",
    "Place into Black Cart (Trash / Landfill)",
  ];
}

export function getConditionalPivot(
  verdict: SortingVerdict
): ConditionalPivot | null {
  const text = `${verdict.query} ${verdict.itemTitle} ${verdict.ruleHeadline}`.toLowerCase();

  if (/pizza/i.test(text)) {
    return {
      condition: "Clean cardboard lid vs. greasy bottom",
      alternateDestination: "blue",
      alternateLabel: "🟦 Blue Cart if clean",
      advice:
        "Clean, unsoiled cardboard pizza box tops (flattened) can be torn off and recycled in the Blue Cart.",
    };
  }
  if (/foil/i.test(text)) {
    if (verdict.destination === "black") {
      return {
        condition: "If cleaned & balled up",
        alternateDestination: "blue",
        alternateLabel: "🟦 Blue Cart if cleaned",
        advice:
          "If food oils and sauce can be completely rinsed off, ball it up to at least 2 inches and recycle in the Blue Cart.",
      };
    }
    return {
      condition: "If soiled with food or grease",
      alternateDestination: "black",
      alternateLabel: "⬛ Black Cart if food-soiled",
      advice:
        "Aluminum foil contaminated with baked-on food or oil cannot be recycled or composted and must go to trash.",
    };
  }
  if (/wrapping paper|gift wrap/i.test(text)) {
    return {
      condition: "Foil, metallic, or glitter paper",
      alternateDestination: "black",
      alternateLabel: "⬛ Black Cart if metallic/glitter",
      advice:
        "Only 100% plain paper is recyclable. If wrapping paper contains metallic foil, glitter, or plastic coating, place it in the Black Cart.",
    };
  }
  if (/shred/i.test(text)) {
    return {
      condition: "Contained inside paper bag",
      alternateDestination: "blue",
      alternateLabel: "🟦 Blue Cart inside paper bag",
      advice:
        "Loose shredded paper belongs in the Green Cart. If you prefer the Blue Cart, it must be sealed inside a closed paper bag.",
    };
  }
  if (/\b(packing|foam|shipping)\s+peanuts?\b|\bpeanuts?\s+(?:packing|foam|shipping)\b/i.test(text)) {
    return {
      condition: "Cornstarch vs. Styrofoam",
      alternateDestination: "black",
      alternateLabel: "🚰 Sink if starch · ⬛ Black Cart if foam",
      advice:
        "Hold a peanut under warm water: plant-based starch peanuts dissolve completely in the sink. White foam peanuts belong in the Black Cart or shipping drop-off.",
    };
  }
  if (/caps?|lids?/i.test(text)) {
    return {
      condition: "Loose cap vs. screwed on",
      alternateDestination: "black",
      alternateLabel: "⬛ Black Cart if loose",
      advice:
        "Loose plastic caps fall through the sorting line grates. If you cannot screw the cap onto an empty bottle, place it in the Black Cart.",
    };
  }

  return null;
}

export interface SituationalOption {
  condition: string;
  badge: string;
  destination: BinDestination;
}

export function getSituationalOptions(
  verdict: SortingVerdict
): SituationalOption[] | null {
  const text = `${verdict.query} ${verdict.itemTitle} ${verdict.ruleHeadline} ${verdict.binLabel}`.toLowerCase();

  if (/wrapping paper|gift wrap/i.test(text)) {
    return [
      {
        condition: "100% Plain Paper",
        badge: "Blue Cart · Recycling",
        destination: "blue",
      },
      {
        condition: "Metallic, Foil, or Glitter",
        badge: "Black Cart · Trash",
        destination: "black",
      },
    ];
  }

  if (/pizza/i.test(text)) {
    return [
      {
        condition: "Greasy, Food-Soiled Bottom",
        badge: "Green Cart · Organics",
        destination: "green",
      },
      {
        condition: "Clean Cardboard Top Lid",
        badge: "Blue Cart · Recycling",
        destination: "blue",
      },
    ];
  }

  if (/foil/i.test(text)) {
    return [
      {
        condition: "Clean & Balled Up (2\"+)",
        badge: "Blue Cart · Recycling",
        destination: "blue",
      },
      {
        condition: "Food-Soiled or Baked-On Grease",
        badge: "Black Cart · Trash",
        destination: "black",
      },
    ];
  }

  if (/\b(packing|foam|shipping)\s+peanuts?\b|\bpeanuts?\s+(?:packing|foam|shipping)\b/i.test(text)) {
    return [
      {
        condition: "Cornstarch (Dissolves in Water)",
        badge: "Green Cart · Organics (or Sink)",
        destination: "green",
      },
      {
        condition: "Styrofoam Polystyrene Foam",
        badge: "Black Cart · Trash (or Reuse)",
        destination: "black",
      },
    ];
  }

  if (/shred/i.test(text)) {
    return [
      {
        condition: "Loose Paper Shreds",
        badge: "Green Cart · Organics",
        destination: "green",
      },
      {
        condition: "Sealed Inside Paper Bag",
        badge: "Blue Cart · Recycling",
        destination: "blue",
      },
    ];
  }

  if (/caps?|lids?/i.test(text)) {
    return [
      {
        condition: "Screwed Tightly Onto Bottle",
        badge: "Blue Cart · Recycling",
        destination: "blue",
      },
      {
        condition: "Loose Plastic Cap",
        badge: "Black Cart · Trash",
        destination: "black",
      },
    ];
  }

  return null;
}

