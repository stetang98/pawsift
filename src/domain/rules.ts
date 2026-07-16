import type { AuditRequest, Finding, Verdict } from "./schemas";
import { sha256 } from "./canonical";

export const RULESET_VERSION = "2026.07.2";
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
    label: "food",
    pattern:
      /^(?:food|pet food|cat food|dog food)$|\b(?:cat|dog|pet)\s+food\b(?!\s+(?:bowl|container|dish|dispenser|mat|scoop|station|storage))/i
  },
  {
    label: "treat",
    pattern:
      /^(?:treat|treats|pet treat|pet treats|cat treat|cat treats|dog treat|dog treats)$|\b(?:cat|dog|pet)\s+treats?\b(?!\s+(?:bag|container|dispenser|holder|jar|loop|pouch|storage|toy))/i
  },
  {
    label: "medication",
    pattern: /\bmedicat(?:e|ed|es|ing|ion|ions)\b/i
  },
  {
    label: "pesticide",
    pattern: /\bpesticides?\b/i
  },
  {
    label: "anti-inflammatory",
    pattern: /\banti-inflammatory\b/i
  },
  {
    label: "anxiety",
    pattern: /\banxiety\b/i
  },
  {
    label: "calming",
    pattern: /\bcalming\b/i
  },
  {
    label: "cure",
    pattern: /\bcure(?:s|d)?\b/i
  },
  {
    label: "digest",
    pattern: /\bdigest(?:ive|ion|s|ed|ing)?\b/i
  },
  {
    label: "edible",
    pattern: /\bedible\b/i
  },
  {
    label: "flea treatment",
    pattern: /\bflea\s+treatment\b/i
  },
  {
    label: "heal",
    pattern: /\bheal(?:s|ed|ing)?\b/i
  },
  {
    label: "ingest",
    pattern: /\bingest(?:ible|ion|s|ed|ing)?\b/i
  },
  {
    label: "medicated",
    pattern: /\bmedicated\b/i
  },
  {
    label: "pain relief",
    pattern: /\bpain\s+relief\b/i
  },
  {
    label: "post-treatment",
    pattern: /\bpost-treatment\b/i
  },
  {
    label: "safe to eat",
    pattern: /\bsafe\s+to\s+eat\b/i
  },
  {
    label: "supplement",
    pattern: /\bsupplement(?:s|al)?\b/i
  },
  {
    label: "tick treatment",
    pattern: /\btick\s+treatment\b/i
  },
  {
    label: "treatment",
    pattern: /\btreatment\b/i
  }
] as const;

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
    const matchedLabels = UNSUPPORTED_CLAIM_PATTERNS.filter(({ pattern }) =>
      pattern.test(field.value)
    ).map(({ label }) => label);

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
  const fullEvidence = `${path}=${value}`;

  if (fullEvidence.length <= 500) {
    return fullEvidence;
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
        title: "Unsupported medical or ingestible claim detected",
        reason:
          "The listing includes medical or ingestible language that falls outside PawSift's supported non-veterinary scope.",
        evidence: unsupportedListingText.map(formatUnsupportedEvidence),
        remediation: "Remove medical or ingestible language and restate only observable product facts."
      });
    },
    ownerQuestions: () => ["Can you remove medical, treatment, or ingestible language from the claims?"],
    listingPatch: () => [
      "Replace medical or ingestible claims with observable, non-veterinary product facts."
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
