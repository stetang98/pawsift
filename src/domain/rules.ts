import type { AuditRequest, Finding, Verdict } from "./schemas";
import { sha256 } from "./canonical";

export const RULESET_VERSION = "2026.07.7";
export const BOUNDARY_TEXT = "Non-veterinary product-fit audit based only on supplied facts.";

export type Rule = {
  id: string;
  penalty: number;
  verdictFloor: Verdict;
  applies: (input: AuditRequest) => boolean;
  buildFinding: (input: AuditRequest) => Finding;
  missingFacts?: (input: AuditRequest) => string[];
  ownerQuestions?: (input: AuditRequest) => string[];
  listingPatch?: (input: AuditRequest) => string[];
};

const UNSUPPORTED_CLAIM_PATTERNS = [
  {
    label: "medication",
    pattern: /\bmedicat(?:e|ed|es|ing|ion|ions)/i
  },
  {
    label: "pesticide",
    pattern: /\bpesticides?/i
  },
  {
    label: "anti-inflammatory",
    pattern: /\banti[-_\s]*inflammatory/i
  },
  {
    label: "anxiety",
    pattern: /\banxiety/i
  },
  {
    label: "calming",
    pattern: /\bcalming/i
  },
  {
    label: "cure",
    pattern: /\bcure(?:s|d)?\b/i
  },
  {
    label: "digest",
    pattern: /\bdigest(?:ive|ion|s|ed|ing)?/i
  },
  {
    label: "edible",
    pattern: /\bedible/i
  },
  {
    label: "flea treatment",
    pattern: /\bflea[-_\s]*treatment/i
  },
  {
    label: "heal",
    pattern: /\bheal(?:s|ed|ing)?\b/i
  },
  {
    label: "ingest",
    pattern: /\bingest(?:ible|ion|s|ed|ing)?/i
  },
  {
    label: "medicated",
    pattern: /\bmedicated/i
  },
  {
    label: "pain relief",
    pattern: /\bpain[-_\s]*relief/i
  },
  {
    label: "post-treatment",
    pattern: /\bpost[-_\s]*treatment/i
  },
  {
    label: "safe to eat",
    pattern: /\bsafe[-_\s]*to[-_\s]*eat/i
  },
  {
    label: "supplement",
    pattern: /\bsupplement(?:s|al)?/i
  },
  {
    label: "tick treatment",
    pattern: /\btick[-_\s]*treatment/i
  },
  {
    label: "treatment",
    pattern: /\btreatment/i
  }
] as const;

const INGESTIBLE_PRODUCT_CONTEXT =
  /\b(?:beef|chews?|chicken|dry|edible|flavou?red?|freeze[-_\s]?dried|kibble|meal|meat|protein|raw|recipe|salmon|single[-_\s]?ingredient|snacks?|tuna|turkey|wet)\b/i;

const UNICODE_DASH_PATTERN = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;

const OBFUSCATED_UNSUPPORTED_TOKEN_PATTERN =
  /^(?:(?:food|treats?|medicat(?:e|ed|es|ing|ion|ions)|pesticides?|antiinflammatory|anxiety|calming|cure(?:s|d)?|digest(?:ive|ion|s|ed|ing)?|edible|fleatreatment|heal(?:s|ed|ing)?|ingest(?:ible|ion|s|ed|ing)?|painrelief|posttreatment|safetoeat|supplement(?:s|al)?|ticktreatment|treatment)(?:accessor(?:y|ies)|bags?|beds?|bins?|bowls?|carriers?|collars?|containers?|dish(?:es)?|dispensers?|feeders?|groomers?|grooming|harness(?:es)?|holders?|jars?|kits?|loops?|mats?|pockets?|pouches?|products?|puzzles?|scoops?|stations?|storage|toys?)?)$/iu;

const SAFE_ACCESSORY_CONTEXT_TOKENS = new Set([
  "a",
  "an",
  "and",
  "anti",
  "automatic",
  "bag",
  "bags",
  "bamboo",
  "base",
  "bin",
  "bins",
  "black",
  "blue",
  "bowl",
  "bowls",
  "canvas",
  "cat",
  "cats",
  "ceramic",
  "clean",
  "collapsible",
  "collar",
  "collars",
  "container",
  "containers",
  "cotton",
  "daily",
  "dish",
  "dishes",
  "dishwasher",
  "dispenser",
  "dispensers",
  "dog",
  "dogs",
  "elevated",
  "feeder",
  "feeders",
  "foldable",
  "for",
  "from",
  "glass",
  "grade",
  "green",
  "holder",
  "holders",
  "harness",
  "harnesses",
  "indoor",
  "jar",
  "jars",
  "kitten",
  "kittens",
  "large",
  "lid",
  "lids",
  "loop",
  "loops",
  "made",
  "mat",
  "mats",
  "medium",
  "metal",
  "non",
  "of",
  "outdoor",
  "pet",
  "pets",
  "plastic",
  "pocket",
  "pockets",
  "portable",
  "pouch",
  "pouches",
  "puppies",
  "puppy",
  "puzzle",
  "puzzles",
  "red",
  "rubber",
  "safe",
  "scoop",
  "scoops",
  "silicone",
  "slip",
  "slow",
  "small",
  "stainless",
  "station",
  "stations",
  "steel",
  "storage",
  "the",
  "to",
  "toy",
  "toys",
  "training",
  "travel",
  "use",
  "wash",
  "washable",
  "water",
  "white",
  "with",
  "without",
  "wood",
  "wooden",
  "yellow"
]);

const FOOD_ACCESSORY_PHRASES = [
  /food[-_\s]*(?:&|and)[-_\s]*water[-_\s]*(?:bowls?|dish(?:es)?|dispensers?|mats?|stations?)\b/gi,
  /food[-_\s]*grade\b/gi,
  /food[-_\s]*(?:bowls?|containers?|dish(?:es)?|dispensers?|mats?|puzzles?|scoops?|stations?|storage(?:[-_\s]*(?:bins?|containers?))?|toys?)\b/gi
] as const;

const TREAT_ACCESSORY_PHRASES = [
  /treat[-_\s]*training[-_\s]*(?:bags?|pouch(?:es)?)\b/gi,
  /treats?[-_\s]*(?:bags?|containers?|dispensers?|holders?|jars?|loops?|pockets?|pouch(?:es)?|storage(?:[-_\s]*(?:bins?|containers?|jars?))?|toys?)\b/gi
] as const;

const FOOD_SCOPE_PATTERN =
  /food(?:\b|[-_\s]*(?:(?:&|and)[-_\s]*water[-_\s]*(?:bowls?|dish(?:es)?|dispensers?|mats?|stations?)|grade\b|(?:bowls?|containers?|dish(?:es)?|dispensers?|mats?|puzzles?|scoops?|stations?|storage(?:[-_\s]*(?:bins?|containers?))?|toys?)\b))/i;

const TREAT_SCOPE_PATTERN =
  /treats?(?:\b|[-_\s]*(?:training[-_\s]*(?:bags?|pouch(?:es)?)|(?:bags?|containers?|dispensers?|holders?|jars?|loops?|pockets?|pouch(?:es)?|storage(?:[-_\s]*(?:bins?|containers?|jars?))?|toys?)\b))/i;

type ScopeTextViews = {
  boundaryPreserving: string;
  compact: string;
};

function normalizeScopeText(value: string): ScopeTextViews {
  const compatibleValue = value.normalize("NFKC").replace(UNICODE_DASH_PATTERN, "-");
  const normalizeWhitespace = (text: string) => text.replace(/\s+/g, " ").trim();

  return {
    boundaryPreserving: normalizeWhitespace(compatibleValue.replace(/\p{Cf}/gu, " ")),
    compact: normalizeWhitespace(compatibleValue.replace(/\p{Cf}/gu, ""))
  };
}

function stripAccessoryPhrases(value: string, patterns: readonly RegExp[]): string {
  return patterns.reduce((remaining, pattern) => remaining.replace(pattern, " "), value);
}

function hasOnlySafeAccessoryContext(value: string): boolean {
  const contextTokens = value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return contextTokens.every((token) => SAFE_ACCESSORY_CONTEXT_TOKENS.has(token));
}

function hasObfuscatedUnsupportedText(value: string): boolean {
  const formatBearingTokens = value.normalize("NFKC").match(/[\p{L}\p{N}\p{Cf}]+/gu) ?? [];

  return formatBearingTokens.some((token) => {
    if (!/\p{Cf}/u.test(token)) {
      return false;
    }

    return OBFUSCATED_UNSUPPORTED_TOKEN_PATTERN.test(token.replace(/\p{Cf}/gu, ""));
  });
}

function hasUnsupportedFoodText(value: string): boolean {
  const { boundaryPreserving, compact } = normalizeScopeText(value);
  const boundaryHasScope = FOOD_SCOPE_PATTERN.test(boundaryPreserving);
  const compactHasScope = FOOD_SCOPE_PATTERN.test(compact);

  if (!boundaryHasScope && !compactHasScope) {
    return false;
  }

  if (!boundaryHasScope && compactHasScope) {
    return true;
  }

  if (
    INGESTIBLE_PRODUCT_CONTEXT.test(boundaryPreserving) ||
    INGESTIBLE_PRODUCT_CONTEXT.test(compact)
  ) {
    return true;
  }

  if (!compactHasScope) {
    return true;
  }

  const remainingText = stripAccessoryPhrases(compact, FOOD_ACCESSORY_PHRASES);
  return FOOD_SCOPE_PATTERN.test(remainingText) || !hasOnlySafeAccessoryContext(remainingText);
}

function hasUnsupportedTreatText(value: string): boolean {
  const { boundaryPreserving, compact } = normalizeScopeText(value);
  const boundaryHasScope = TREAT_SCOPE_PATTERN.test(boundaryPreserving);
  const compactHasScope = TREAT_SCOPE_PATTERN.test(compact);

  if (!boundaryHasScope && !compactHasScope) {
    return false;
  }

  if (!boundaryHasScope && compactHasScope) {
    return true;
  }

  if (
    INGESTIBLE_PRODUCT_CONTEXT.test(boundaryPreserving) ||
    INGESTIBLE_PRODUCT_CONTEXT.test(compact)
  ) {
    return true;
  }

  if (!compactHasScope) {
    return true;
  }

  const remainingText = stripAccessoryPhrases(compact, TREAT_ACCESSORY_PHRASES);
  return TREAT_SCOPE_PATTERN.test(remainingText) || !hasOnlySafeAccessoryContext(remainingText);
}

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

function formatWeight(weightKg: number): string {
  return Number.isInteger(weightKg) ? weightKg.toString() : weightKg.toFixed(1);
}

function createFinding(params: {
  ruleId: string;
  severity: Verdict;
  title: string;
  reason: string;
  evidence: string[];
  remediation: string;
}): Finding {
  return {
    ruleId: params.ruleId,
    severity: params.severity,
    title: params.title,
    reason: params.reason,
    evidence: params.evidence,
    remediation: params.remediation
  };
}

function isSpeciesMismatch(input: AuditRequest): boolean {
  return !input.product.intendedSpecies.includes(input.pet.species);
}

function isWeightRangeMismatch(input: AuditRequest): boolean {
  const { minWeightKg, maxWeightKg } = input.product;

  if (minWeightKg !== undefined && input.pet.weightKg < minWeightKg) {
    return true;
  }

  if (input.product.category === "carrier") {
    return false;
  }

  if (maxWeightKg !== undefined && input.pet.weightKg > maxWeightKg) {
    return true;
  }

  return false;
}

function isMissingMaterials(input: AuditRequest): boolean {
  return input.product.materials.length === 0;
}

function isUnsafeToyWithoutSupervision(input: AuditRequest): boolean {
  return (
    input.product.category === "toy" &&
    input.product.hasDetachableParts === true &&
    isBlank(input.product.supervisionStatement)
  );
}

function hasBatteryOrMagnet(input: AuditRequest): boolean {
  return input.product.containsBattery === true || input.product.containsMagnet === true;
}

function isCatCollarWithoutBreakaway(input: AuditRequest): boolean {
  return (
    input.product.category === "collar_harness" &&
    (input.pet.species === "cat" || input.product.intendedSpecies.includes("cat")) &&
    input.product.breakaway === undefined
  );
}

function isOverweightCarrier(input: AuditRequest): boolean {
  return (
    input.product.category === "carrier" &&
    input.product.maxWeightKg !== undefined &&
    input.pet.weightKg > input.product.maxWeightKg
  );
}

type WeightSupportField = "minWeightKg" | "maxWeightKg";

const REQUIRED_WEIGHT_SUPPORT_FIELDS: Partial<
  Record<AuditRequest["product"]["category"], readonly WeightSupportField[]>
> = {
  bed: ["maxWeightKg"],
  carrier: ["maxWeightKg"],
  collar_harness: ["minWeightKg", "maxWeightKg"]
};

function getMissingRequiredWeightSupportFields(input: AuditRequest): WeightSupportField[] {
  const requiredFields = REQUIRED_WEIGHT_SUPPORT_FIELDS[input.product.category] ?? [];
  return requiredFields.filter((field) => input.product[field] === undefined);
}

function isMissingRequiredWeightSupport(input: AuditRequest): boolean {
  return getMissingRequiredWeightSupportFields(input).length > 0;
}

type ListingTextField = {
  path: string;
  value: string;
};

type UnsupportedListingText = ListingTextField & {
  matchedLabels: string[];
};

function getListingTextFields(input: AuditRequest): ListingTextField[] {
  return [
    {
      path: "product.name",
      value: input.product.name
    },
    ...input.product.materials.map((value, index) => ({
      path: `product.materials[${index}]`,
      value
    })),
    ...(input.product.supervisionStatement
      ? [
          {
            path: "product.supervisionStatement",
            value: input.product.supervisionStatement
          }
        ]
      : []),
    ...(input.product.careInstructions
      ? [
          {
            path: "product.careInstructions",
            value: input.product.careInstructions
          }
        ]
      : []),
    ...input.product.claims.map((value, index) => ({
      path: `product.claims[${index}]`,
      value
    }))
  ];
}

function getUnsupportedListingText(input: AuditRequest): UnsupportedListingText[] {
  return getListingTextFields(input).flatMap((field) => {
    const normalizedValues = Object.values(normalizeScopeText(field.value));
    const matchedLabels = [
      ...(hasUnsupportedFoodText(field.value) ? ["food"] : []),
      ...(hasUnsupportedTreatText(field.value) ? ["treat"] : []),
      ...(hasObfuscatedUnsupportedText(field.value) ? ["obfuscated scope wording"] : []),
      ...UNSUPPORTED_CLAIM_PATTERNS.filter(({ pattern }) =>
        normalizedValues.some((normalizedValue) => pattern.test(normalizedValue))
      ).map(({ label }) => label)
    ];

    return matchedLabels.length > 0
      ? [
          {
            ...field,
            matchedLabels
          }
        ]
      : [];
  });
}

function formatUnsupportedEvidence({
  path,
  value,
  matchedLabels
}: UnsupportedListingText): string {
  const hasFormatControl = /\p{Cf}/u.test(value);
  const normalizedSuffix = hasFormatControl
    ? `;normalized=${normalizeScopeText(value).compact}`
    : "";
  const fullEvidence = `${path}=${value}${normalizedSuffix}`;

  if (fullEvidence.length <= 500) {
    return fullEvidence;
  }

  if (hasFormatControl) {
    const normalizedValue = normalizeScopeText(value).compact;
    const labelPreview = matchedLabels.join(",").slice(0, 100);
    const normalizedPreview =
      normalizedValue.length > 96 ? `${normalizedValue.slice(0, 93)}...` : normalizedValue;

    return `${path}=matched:${labelPreview};normalized=${normalizedPreview};valueSha256=${sha256(value)};normalizedSha256=${sha256(normalizedValue)}`;
  }

  return `${path}=matched:${matchedLabels.join(",")};valueSha256=${sha256(value)}`;
}

function hasUnsupportedClaims(input: AuditRequest): boolean {
  return getUnsupportedListingText(input).length > 0;
}

function isMissingCareInstructions(input: AuditRequest): boolean {
  return isBlank(input.product.careInstructions);
}

const ISSUE_PREDICATES = [
  isSpeciesMismatch,
  isWeightRangeMismatch,
  isMissingMaterials,
  isUnsafeToyWithoutSupervision,
  hasBatteryOrMagnet,
  isCatCollarWithoutBreakaway,
  isOverweightCarrier,
  isMissingRequiredWeightSupport,
  hasUnsupportedClaims,
  isMissingCareInstructions
] as const;

function isCompleteInRangeListing(input: AuditRequest): boolean {
  return ISSUE_PREDICATES.every((predicate) => !predicate(input));
}

export const RULES: readonly Rule[] = [
  {
    id: "PS-001",
    penalty: 45,
    verdictFloor: "BLOCK",
    applies: isSpeciesMismatch,
    buildFinding: (input) =>
      createFinding({
        ruleId: "PS-001",
        severity: "BLOCK",
        title: "Intended species does not match the pet profile",
        reason:
          "The listing targets a different species than the supplied pet, so the fit result cannot be approved.",
        evidence: [
          `pet.species=${input.pet.species}`,
          `intendedSpecies=${input.product.intendedSpecies.join(",")}`
        ],
        remediation: "Align the listing species or choose a product intended for this pet."
      })
  },
  {
    id: "PS-002",
    penalty: 28,
    verdictFloor: "BLOCK",
    applies: isWeightRangeMismatch,
    buildFinding: (input) =>
      createFinding({
        ruleId: "PS-002",
        severity: "BLOCK",
        title: "Pet is outside the declared weight range",
        reason:
          "The supplied pet weight falls outside the declared weight range, so the product fit should be blocked.",
        evidence: [
          `pet.weightKg=${formatWeight(input.pet.weightKg)}`,
          ...(input.product.minWeightKg !== undefined
            ? [`minWeightKg=${formatWeight(input.product.minWeightKg)}`]
            : []),
          ...(input.product.maxWeightKg !== undefined
            ? [`maxWeightKg=${formatWeight(input.product.maxWeightKg)}`]
            : [])
        ],
        remediation: "Correct the supported weight range or pick a product sized for this pet."
      })
  },
  {
    id: "PS-003",
    penalty: 8,
    verdictFloor: "CAUTION",
    applies: isMissingMaterials,
    buildFinding: () =>
      createFinding({
        ruleId: "PS-003",
        severity: "CAUTION",
        title: "Materials are missing from the listing",
        reason:
          "The listing omits product materials, which makes it harder to evaluate surface contact and durability.",
        evidence: ["materials=0"],
        remediation: "List the primary materials, including any surface that touches the pet."
      }),
    missingFacts: () => ["materials"],
    ownerQuestions: () => ["What materials touch the pet or the pet's mouth?"],
    listingPatch: () => [
      "List the primary materials, including anything that touches the pet or its mouth."
    ]
  },
  {
    id: "PS-004",
    penalty: 9,
    verdictFloor: "CAUTION",
    applies: isUnsafeToyWithoutSupervision,
    buildFinding: (input) =>
      createFinding({
        ruleId: "PS-004",
        severity: "CAUTION",
        title: "Supervision statement missing for detachable toy parts",
        reason:
          "The toy has detachable parts but the listing does not say the pet should be supervised during play.",
        evidence: [
          `category=${input.product.category}`,
          "hasDetachableParts=true",
          "supervisionStatement=missing"
        ],
        remediation: "Add a supervision statement for toys with detachable parts."
      }),
    ownerQuestions: () => ["Should owners supervise play when detachable parts are exposed?"],
    listingPatch: () => ["Add a supervision statement for toys with detachable parts."]
  },
  {
    id: "PS-005",
    penalty: 20,
    verdictFloor: "HUMAN_REVIEW",
    applies: hasBatteryOrMagnet,
    buildFinding: (input) =>
      createFinding({
        ruleId: "PS-005",
        severity: "HUMAN_REVIEW",
        title: "Battery or magnet requires manual review",
        reason:
          "Listings that disclose a battery or magnet need an explicit enclosure and monitoring explanation before approval.",
        evidence: [
          ...(input.product.containsBattery === true ? ["containsBattery=true"] : []),
          ...(input.product.containsMagnet === true ? ["containsMagnet=true"] : [])
        ],
        remediation: "Add enclosure, access, and monitoring details for the battery or magnet."
      }),
    ownerQuestions: () => [
      "Does the listing explain how the battery or magnet is enclosed and monitored?"
    ],
    listingPatch: () => [
      "Clarify how the battery or magnet is enclosed and what supervision limits apply."
    ]
  },
  {
    id: "PS-006",
    penalty: 10,
    verdictFloor: "CAUTION",
    applies: isCatCollarWithoutBreakaway,
    buildFinding: (input) =>
      createFinding({
        ruleId: "PS-006",
        severity: "CAUTION",
        title: "Breakaway status missing for cat collar",
        reason:
          "Cat collars should state whether they include a breakaway release so owners know how the closure behaves.",
        evidence: [
          `category=${input.product.category}`,
          `pet.species=${input.pet.species}`,
          "breakaway=missing"
        ],
        remediation: "State whether the collar includes a breakaway release."
      }),
    missingFacts: () => ["breakaway"],
    ownerQuestions: () => ["Does this collar include a breakaway release for cats?"],
    listingPatch: () => ["State whether the collar includes a breakaway release for cats."]
  },
  {
    id: "PS-007",
    penalty: 30,
    verdictFloor: "BLOCK",
    applies: isOverweightCarrier,
    buildFinding: (input) =>
      createFinding({
        ruleId: "PS-007",
        severity: "BLOCK",
        title: "Carrier is rated below the pet's weight",
        reason:
          "The carrier's supported weight is below the supplied pet weight, so this carrier should be blocked.",
        evidence: [
          `category=${input.product.category}`,
          `pet.weightKg=${formatWeight(input.pet.weightKg)}`,
          `maxWeightKg=${formatWeight(input.product.maxWeightKg ?? 0)}`
        ],
        remediation: "Choose a carrier with a supported weight at or above the pet's weight."
      })
  },
  {
    id: "PS-008",
    penalty: 18,
    verdictFloor: "HUMAN_REVIEW",
    applies: hasUnsupportedClaims,
    buildFinding: (input) => {
      const unsupportedListingText = getUnsupportedListingText(input);

      return createFinding({
        ruleId: "PS-008",
        severity: "HUMAN_REVIEW",
        title: "Unsupported medical or ingestible wording detected",
        reason:
          "The listing includes medical or ingestible language that falls outside PawSift's supported non-veterinary scope.",
        evidence: unsupportedListingText.map(formatUnsupportedEvidence),
        remediation: "Remove medical or ingestible language and restate only observable product facts."
      });
    },
    ownerQuestions: () => [
      "Can you remove medical, treatment, or ingestible language from the submitted product listing?"
    ],
    listingPatch: () => [
      "Replace medical or ingestible wording with observable, non-veterinary product facts."
    ]
  },
  {
    id: "PS-009",
    penalty: 7,
    verdictFloor: "CAUTION",
    applies: isMissingCareInstructions,
    buildFinding: () =>
      createFinding({
        ruleId: "PS-009",
        severity: "CAUTION",
        title: "Care instructions are missing",
        reason:
          "The listing should explain how the product is cleaned or maintained so owners know the ongoing care steps.",
        evidence: ["careInstructions=missing"],
        remediation: "Add care instructions with cleaning or maintenance steps."
      }),
    missingFacts: () => ["careInstructions"],
    ownerQuestions: () => ["Can you add care instructions for the listing?"],
    listingPatch: () => ["Add care instructions with cleaning or maintenance steps."]
  },
  {
    id: "PS-010",
    penalty: 0,
    verdictFloor: "CLEAR",
    applies: isCompleteInRangeListing,
    buildFinding: (input) =>
      createFinding({
        ruleId: "PS-010",
        severity: "CLEAR",
        title: "Listing includes the core facts needed for this audit",
        reason:
          "The supplied facts are complete enough for a deterministic non-veterinary fit check and no blocking rule fired.",
        evidence: [
          `pet.species=${input.pet.species}`,
          `category=${input.product.category}`,
          ...(input.product.minWeightKg !== undefined || input.product.maxWeightKg !== undefined
            ? [
                `weightRange=${input.product.minWeightKg !== undefined ? formatWeight(input.product.minWeightKg) : "open"}-${input.product.maxWeightKg !== undefined ? formatWeight(input.product.maxWeightKg) : "open"}`
              ]
            : [])
        ],
        remediation: "No immediate listing patch is required from the supplied facts."
      })
  },
  {
    id: "PS-011",
    penalty: 10,
    verdictFloor: "CAUTION",
    applies: isMissingRequiredWeightSupport,
    buildFinding: (input) => {
      const missingFields = getMissingRequiredWeightSupportFields(input);

      return createFinding({
        ruleId: "PS-011",
        severity: "CAUTION",
        title: "Supported weight facts are missing for this category",
        reason:
          "The listing omits category-specific supported weight facts, so PawSift cannot mark the fit information complete.",
        evidence: [
          `category=${input.product.category}`,
          ...missingFields.map((field) => `${field}=missing`)
        ],
        remediation: "Add the missing supported weight facts before treating this listing as complete."
      });
    },
    missingFacts: getMissingRequiredWeightSupportFields,
    ownerQuestions: (input) => {
      const missingFields = getMissingRequiredWeightSupportFields(input);
      return missingFields.length === 2
        ? ["What minimum and maximum pet weights does this listing support?"]
        : ["What maximum pet weight does this listing support?"];
    },
    listingPatch: (input) => [
      `Add the supported ${getMissingRequiredWeightSupportFields(input).join(" and ")} value${getMissingRequiredWeightSupportFields(input).length === 1 ? "" : "s"}.`
    ]
  }
] as const;
