import type { AuditRequest, Verdict } from "./schemas";

export type AuditFixture = {
  id: string;
  label: string;
  summary: string;
  request: AuditRequest;
  expectedVerdict: Verdict;
  expectedRuleIds: string[];
};

export const clearCatCollarFixture: AuditRequest = {
  pet: {
    species: "cat",
    lifeStage: "adult",
    weightKg: 4.8,
    traits: ["indoor", "curious"]
  },
  product: {
    name: "Breakaway Reflective Collar",
    category: "collar_harness",
    intendedSpecies: ["cat"],
    materials: ["nylon", "zinc_alloy"],
    minWeightKg: 2.5,
    maxWeightKg: 7,
    breakaway: true,
    careInstructions: "Hand wash and air dry.",
    claims: ["adjustable", "reflective"]
  }
};

export const speciesMismatchFixture: AuditRequest = {
  pet: {
    species: "cat",
    lifeStage: "adult",
    weightKg: 4.8,
    traits: ["calm"]
  },
  product: {
    name: "Trail Dog Bed",
    category: "bed",
    intendedSpecies: ["dog"],
    materials: ["canvas", "polyfill"],
    minWeightKg: 3,
    maxWeightKg: 18,
    careInstructions: "Spot clean with mild soap and air dry.",
    claims: ["portable", "washable"]
  }
};

export const weightRangeMismatchFixture: AuditRequest = {
  pet: {
    species: "dog",
    lifeStage: "senior",
    weightKg: 12,
    traits: ["short_legged"]
  },
  product: {
    name: "Compact Lounge Bed",
    category: "bed",
    intendedSpecies: ["dog"],
    materials: ["fleece", "polyester_fill"],
    minWeightKg: 2,
    maxWeightKg: 9,
    careInstructions: "Machine wash cold and tumble dry low.",
    claims: ["orthopedic-style support", "non-slip base"]
  }
};

export const missingMaterialsFixture: AuditRequest = {
  pet: {
    species: "dog",
    lifeStage: "adult",
    weightKg: 8.5,
    traits: ["sheds"]
  },
  product: {
    name: "De-shedding Grooming Mitt",
    category: "grooming_tool",
    intendedSpecies: ["dog", "cat"],
    materials: [],
    careInstructions: "Rinse the mitt and hang it to dry.",
    claims: ["reusable", "gentle bristles"]
  }
};

export const unsafeToyFixture: AuditRequest = {
  pet: {
    species: "dog",
    lifeStage: "adult",
    weightKg: 9.4,
    traits: ["fetch-loving"]
  },
  product: {
    name: "Puzzle Squeak Ball",
    category: "toy",
    intendedSpecies: ["dog"],
    materials: ["rubber", "plush"],
    hasDetachableParts: true,
    careInstructions: "Wipe clean after play.",
    claims: ["interactive", "mental stimulation"]
  }
};

export const magneticCatToyFixture: AuditRequest = {
  pet: {
    species: "cat",
    lifeStage: "adult",
    weightKg: 3.9,
    traits: ["playful"]
  },
  product: {
    name: "Whirl Magnet Wand",
    category: "toy",
    intendedSpecies: ["cat"],
    materials: ["abs_plastic", "polyester"],
    containsMagnet: true,
    careInstructions: "Store indoors and wipe with a dry cloth.",
    claims: ["teaser wand", "indoor play"]
  }
};

export const missingBreakawayFixture: AuditRequest = {
  pet: {
    species: "cat",
    lifeStage: "adult",
    weightKg: 4.2,
    traits: ["outdoor-supervised"]
  },
  product: {
    name: "Reflective Cat Collar",
    category: "collar_harness",
    intendedSpecies: ["cat"],
    materials: ["nylon", "plastic"],
    minWeightKg: 2.5,
    maxWeightKg: 6.5,
    careInstructions: "Hand wash and dry flat.",
    claims: ["reflective", "adjustable"]
  }
};

export const overweightCarrierFixture: AuditRequest = {
  pet: {
    species: "dog",
    lifeStage: "adult",
    weightKg: 8.1,
    traits: ["travel_friendly"]
  },
  product: {
    name: "Metro Soft Carrier",
    category: "carrier",
    intendedSpecies: ["dog"],
    materials: ["polyester", "mesh"],
    maxWeightKg: 6,
    careInstructions: "Wipe the frame and hand wash the liner.",
    claims: ["airline-style", "ventilated"]
  }
};

export const unsupportedClaimFixture: AuditRequest = {
  pet: {
    species: "dog",
    lifeStage: "adult",
    weightKg: 7.4,
    traits: ["recovering_from_surgery"]
  },
  product: {
    name: "Compression Recovery Wrap",
    category: "collar_harness",
    intendedSpecies: ["dog"],
    materials: ["neoprene", "hook_and_loop"],
    minWeightKg: 3,
    maxWeightKg: 12,
    careInstructions: "Hand wash cold and air dry flat.",
    claims: ["anti-inflammatory", "post-treatment comfort"]
  }
};

export const missingWeightSupportFixture: AuditRequest = {
  pet: {
    species: "cat",
    lifeStage: "adult",
    weightKg: 4.6,
    traits: ["indoor"]
  },
  product: {
    name: "Everyday Breakaway Collar",
    category: "collar_harness",
    intendedSpecies: ["cat"],
    materials: ["nylon", "plastic"],
    breakaway: true,
    careInstructions: "Hand wash and air dry.",
    claims: ["adjustable", "reflective"]
  }
};

export const missingCareInstructionsFixture: AuditRequest = {
  pet: {
    species: "dog",
    lifeStage: "adult",
    weightKg: 6.7,
    traits: ["messy_eater"]
  },
  product: {
    name: "Raised Slow Feeder",
    category: "feeder",
    intendedSpecies: ["dog"],
    materials: ["stainless_steel", "bamboo"],
    minWeightKg: 2,
    maxWeightKg: 20,
    claims: ["slow feeding", "stable base"]
  }
};

export const AUDIT_FIXTURES: readonly AuditFixture[] = [
  {
    id: "clear-cat-collar",
    label: "Clear collar example",
    summary: "A complete cat collar listing with breakaway facts and care instructions.",
    request: clearCatCollarFixture,
    expectedVerdict: "CLEAR",
    expectedRuleIds: ["PS-010"]
  },
  {
    id: "species-mismatch",
    label: "Species mismatch",
    summary: "A dog bed listing applied to a cat profile.",
    request: speciesMismatchFixture,
    expectedVerdict: "BLOCK",
    expectedRuleIds: ["PS-001"]
  },
  {
    id: "weight-range-mismatch",
    label: "Weight mismatch",
    summary: "A bed listing whose stated range is below the pet's weight.",
    request: weightRangeMismatchFixture,
    expectedVerdict: "BLOCK",
    expectedRuleIds: ["PS-002"]
  },
  {
    id: "missing-materials",
    label: "Missing materials",
    summary: "A grooming listing that omits materials.",
    request: missingMaterialsFixture,
    expectedVerdict: "CAUTION",
    expectedRuleIds: ["PS-003"]
  },
  {
    id: "unsafe-toy",
    label: "Toy supervision gap",
    summary: "A detachable toy without a supervision statement.",
    request: unsafeToyFixture,
    expectedVerdict: "CAUTION",
    expectedRuleIds: ["PS-004"]
  },
  {
    id: "magnetic-toy",
    label: "Magnet disclosure",
    summary: "A toy that discloses a magnet and requires manual review.",
    request: magneticCatToyFixture,
    expectedVerdict: "HUMAN_REVIEW",
    expectedRuleIds: ["PS-005"]
  },
  {
    id: "missing-breakaway",
    label: "Missing breakaway fact",
    summary: "A cat collar listing without breakaway information.",
    request: missingBreakawayFixture,
    expectedVerdict: "CAUTION",
    expectedRuleIds: ["PS-006"]
  },
  {
    id: "overweight-carrier",
    label: "Carrier overload",
    summary: "A carrier rated below the supplied pet's weight.",
    request: overweightCarrierFixture,
    expectedVerdict: "BLOCK",
    expectedRuleIds: ["PS-007"]
  },
  {
    id: "unsupported-claim",
    label: "Unsupported claim",
    summary: "A listing that makes medical treatment claims.",
    request: unsupportedClaimFixture,
    expectedVerdict: "HUMAN_REVIEW",
    expectedRuleIds: ["PS-008"]
  },
  {
    id: "missing-care",
    label: "Missing care instructions",
    summary: "A feeder listing without care instructions.",
    request: missingCareInstructionsFixture,
    expectedVerdict: "CAUTION",
    expectedRuleIds: ["PS-009"]
  },
  {
    id: "missing-weight-support",
    label: "Missing weight support",
    summary: "A collar listing that omits its required supported weight range.",
    request: missingWeightSupportFixture,
    expectedVerdict: "CAUTION",
    expectedRuleIds: ["PS-011"]
  }
] as const;
