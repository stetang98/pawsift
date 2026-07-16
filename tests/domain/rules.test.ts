import { describe, expect, it } from "vitest";

import { auditProduct } from "../../src/domain/audit";
import {
  AUDIT_FIXTURES,
  clearCatCollarFixture,
  magneticCatToyFixture,
  missingCareInstructionsFixture,
  missingMaterialsFixture,
  missingBreakawayFixture,
  overweightCarrierFixture,
  speciesMismatchFixture,
  unsupportedClaimFixture,
  unsafeToyFixture,
  weightRangeMismatchFixture
} from "../../src/domain/fixtures";
import { RULES, RULESET_VERSION } from "../../src/domain/rules";

const maxLengthUnsupportedText = `${"x".repeat(490)} medicated`;

describe("rules metadata", () => {
  it("publishes a stable ordered ruleset", () => {
    expect(RULESET_VERSION).toBe("2026.07.2");
    expect(RULES.map((rule) => rule.id)).toEqual([
      "PS-001",
      "PS-002",
      "PS-003",
      "PS-004",
      "PS-005",
      "PS-006",
      "PS-007",
      "PS-008",
      "PS-009",
      "PS-010",
      "PS-011"
    ]);
  });

  it("publishes a missing weight support fixture in the proof deck", () => {
    expect(AUDIT_FIXTURES.find((fixture) => fixture.id === "missing-weight-support")).toMatchObject({
      expectedVerdict: "CAUTION",
      expectedRuleIds: ["PS-011"]
    });
  });
});

describe("auditProduct", () => {
  it("blocks a product when species do not match", () => {
    const report = auditProduct(speciesMismatchFixture);

    expect(report.verdict).toBe("BLOCK");
    expect(report.rulesetVersion).toBe(RULESET_VERSION);
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-001"]);
    expect(report.findings[0]?.severity).toBe("BLOCK");
    expect(report.missingFacts).toEqual([]);
    expect(report.ownerQuestions).toEqual([]);
    expect(report.listingPatch).toEqual([]);
  });

  it("blocks a product when the pet is outside the declared weight range", () => {
    const report = auditProduct(weightRangeMismatchFixture);

    expect(report.verdict).toBe("BLOCK");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-002"]);
    expect(report.findings[0]?.reason).toContain("declared weight range");
    expect(report.score).toBeLessThan(100);
  });

  it("raises caution when materials are missing", () => {
    const report = auditProduct(missingMaterialsFixture);

    expect(report.verdict).toBe("CAUTION");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-003"]);
    expect(report.missingFacts).toEqual(["materials"]);
    expect(report.ownerQuestions).toContain("What materials touch the pet or the pet's mouth?");
  });

  it("raises caution for toys with detachable parts and no supervision statement", () => {
    const report = auditProduct(unsafeToyFixture);

    expect(report.verdict).toBe("CAUTION");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-004"]);
    expect(report.findings[0]?.title).toContain("Supervision");
  });

  it("requires human review when magnets or batteries are disclosed", () => {
    const report = auditProduct(magneticCatToyFixture);

    expect(report.verdict).toBe("HUMAN_REVIEW");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-005"]);
    expect(report.ownerQuestions).toContain("Does the listing explain how the battery or magnet is enclosed and monitored?");
  });

  it("raises caution when a cat collar omits breakaway facts", () => {
    const report = auditProduct(missingBreakawayFixture);

    expect(report.verdict).toBe("CAUTION");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-006"]);
    expect(report.missingFacts).toEqual(["breakaway"]);
  });

  it("blocks a carrier when the pet exceeds the supported weight", () => {
    const report = auditProduct(overweightCarrierFixture);

    expect(report.verdict).toBe("BLOCK");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-007"]);
    expect(report.findings[0]?.reason).toContain("carrier");
    expect(report.findings.map((finding) => finding.ruleId)).not.toContain("PS-002");
  });

  it("keeps carrier lower-bound mismatches on PS-002", () => {
    const report = auditProduct({
      pet: {
        species: "dog",
        lifeStage: "adult",
        weightKg: 4,
        traits: ["travel_friendly"]
      },
      product: {
        name: "Structured Cabin Carrier",
        category: "carrier",
        intendedSpecies: ["dog"],
        materials: ["polyester", "mesh"],
        minWeightKg: 5,
        maxWeightKg: 10,
        careInstructions: "Wipe the shell and air dry the liner.",
        claims: ["ventilated", "carry handle"]
      }
    });

    expect(report.verdict).toBe("BLOCK");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-002"]);
  });

  it("requires human review for unsupported medical or ingestible claims", () => {
    const report = auditProduct(unsupportedClaimFixture);

    expect(report.verdict).toBe("HUMAN_REVIEW");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-008"]);
    expect(report.findings[0]?.evidence).toContain("product.claims[0]=anti-inflammatory");
  });

  it.each([
    {
      field: "product.name",
      value: "Medicated Flea Treatment Collar",
      product: {
        ...clearCatCollarFixture.product,
        name: "Medicated Flea Treatment Collar",
        claims: ["adjustable"]
      }
    },
    {
      field: "product.materials[0]",
      value: "medicated nylon",
      product: {
        ...clearCatCollarFixture.product,
        materials: ["medicated nylon", "zinc_alloy"],
        claims: ["adjustable"]
      }
    },
    {
      field: "product.supervisionStatement",
      value: "Supervise after flea treatment.",
      product: {
        ...clearCatCollarFixture.product,
        supervisionStatement: "Supervise after flea treatment.",
        claims: ["adjustable"]
      }
    },
    {
      field: "product.careInstructions",
      value: "Apply after treatment and wipe clean.",
      product: {
        ...clearCatCollarFixture.product,
        careInstructions: "Apply after treatment and wipe clean.",
        claims: ["adjustable"]
      }
    }
  ])("routes unsupported scope in $field to PS-008 with field evidence", ({ field, value, product }) => {
    const report = auditProduct({
      pet: clearCatCollarFixture.pet,
      product
    });

    expect(report.verdict).toBe("HUMAN_REVIEW");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-008"]);
    expect(report.findings[0]?.evidence).toContain(`${field}=${value}`);
  });

  it("routes direct ingestible phrases such as safe to eat to PS-008", () => {
    const report = auditProduct({
      pet: {
        species: "dog",
        lifeStage: "adult",
        weightKg: 7.4,
        traits: ["curious"]
      },
      product: {
        name: "Cooling Chew Guard",
        category: "toy",
        intendedSpecies: ["dog"],
        materials: ["rubber", "canvas"],
        careInstructions: "Wipe clean and store dry.",
        claims: ["safe to eat", "durable"]
      }
    });

    expect(report.verdict).toBe("HUMAN_REVIEW");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-008"]);
    expect(report.findings[0]?.evidence).toContain("product.claims[0]=safe to eat");
  });

  it.each(["food", "treat", "medication", "pesticide"])(
    "routes the explicitly excluded %s scope to PS-008",
    (claim) => {
      const report = auditProduct({
        pet: clearCatCollarFixture.pet,
        product: {
          ...clearCatCollarFixture.product,
          claims: [claim]
        }
      });

      expect(report.verdict).toBe("HUMAN_REVIEW");
      expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-008"]);
      expect(report.findings[0]?.evidence).toContain(`product.claims[0]=${claim}`);
    }
  );

  it.each(["Premium Cat Food", "Freeze-Dried Dog Treats"])(
    "routes the realistic excluded product name %s to PS-008",
    (name) => {
      const report = auditProduct({
        pet: clearCatCollarFixture.pet,
        product: {
          ...clearCatCollarFixture.product,
          name,
          claims: ["premium"]
        }
      });

      expect(report.verdict).toBe("HUMAN_REVIEW");
      expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-008"]);
      expect(report.findings[0]?.evidence).toContain(`product.name=${name}`);
    }
  );

  it.each([
    {
      field: "product.name",
      product: {
        ...clearCatCollarFixture.product,
        name: maxLengthUnsupportedText,
        claims: ["adjustable"]
      }
    },
    {
      field: "product.materials[0]",
      product: {
        ...clearCatCollarFixture.product,
        materials: [maxLengthUnsupportedText],
        claims: ["adjustable"]
      }
    },
    {
      field: "product.supervisionStatement",
      product: {
        ...clearCatCollarFixture.product,
        supervisionStatement: maxLengthUnsupportedText,
        claims: ["adjustable"]
      }
    },
    {
      field: "product.careInstructions",
      product: {
        ...clearCatCollarFixture.product,
        careInstructions: maxLengthUnsupportedText,
        claims: ["adjustable"]
      }
    },
    {
      field: "product.claims[0]",
      product: {
        ...clearCatCollarFixture.product,
        claims: [maxLengthUnsupportedText]
      }
    }
  ])("bounds PS-008 evidence for a maximum-length $field value", ({ field, product }) => {
    const report = auditProduct({
      pet: clearCatCollarFixture.pet,
      product
    });

    expect(report.verdict).toBe("HUMAN_REVIEW");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-008"]);
    expect(report.findings[0]?.evidence).toHaveLength(1);
    expect(report.findings[0]?.evidence[0]).toMatch(
      new RegExp(`^${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=matched:`)
    );
    expect(report.findings[0]?.evidence[0]).toContain("valueSha256=");
    expect(report.findings[0]?.evidence[0]?.length).toBeLessThanOrEqual(500);
  });

  it("does not flag unrelated words just because they contain a broad substring", () => {
    const report = auditProduct({
      pet: {
        species: "cat",
        lifeStage: "adult",
        weightKg: 4.8,
        traits: ["indoor"]
      },
      product: {
        name: "Pocket Treat Loop Collar",
        category: "collar_harness",
        intendedSpecies: ["cat"],
        materials: ["nylon", "zinc_alloy"],
        minWeightKg: 2.5,
        maxWeightKg: 7,
        breakaway: true,
        careInstructions: "Hand wash and air dry.",
        claims: ["treat pouch loop", "reflective"]
      }
    });

    expect(report.verdict).toBe("CLEAR");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-010"]);
  });

  it("raises caution when care instructions are missing", () => {
    const report = auditProduct(missingCareInstructionsFixture);

    expect(report.verdict).toBe("CAUTION");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-009"]);
    expect(report.missingFacts).toEqual(["careInstructions"]);
    expect(report.listingPatch).toContain("Add care instructions with cleaning or maintenance steps.");
  });

  it("keeps a complete in-range listing clear", () => {
    const report = auditProduct(clearCatCollarFixture);

    expect(report.verdict).toBe("CLEAR");
    expect(report.score).toBe(100);
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-010"]);
    expect(report.missingFacts).toEqual([]);
    expect(report.ownerQuestions).toEqual([]);
    expect(report.listingPatch).toEqual([]);
    expect(report.boundary).toBe("Non-veterinary product-fit audit based only on supplied facts.");
  });

  it("raises caution when a collar listing omits its supported weight range", () => {
    const report = auditProduct({
      pet: clearCatCollarFixture.pet,
      product: {
        name: clearCatCollarFixture.product.name,
        category: "collar_harness",
        intendedSpecies: clearCatCollarFixture.product.intendedSpecies,
        materials: clearCatCollarFixture.product.materials,
        breakaway: true,
        careInstructions: clearCatCollarFixture.product.careInstructions,
        claims: clearCatCollarFixture.product.claims
      }
    });

    expect(report.verdict).toBe("CAUTION");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-011"]);
    expect(report.findings[0]?.evidence).toEqual([
      "category=collar_harness",
      "minWeightKg=missing",
      "maxWeightKg=missing"
    ]);
    expect(report.missingFacts).toEqual(["minWeightKg", "maxWeightKg"]);
    expect(report.findings.map((finding) => finding.ruleId)).not.toContain("PS-010");
  });

  it.each([
    { category: "carrier" as const, productName: "Travel Carrier" },
    { category: "bed" as const, productName: "Supportive Pet Bed" }
  ])("requires a maximum supported weight for $category listings", ({ category, productName }) => {
    const report = auditProduct({
      pet: clearCatCollarFixture.pet,
      product: {
        name: productName,
        category,
        intendedSpecies: ["cat"],
        materials: ["nylon"],
        careInstructions: "Wipe clean and air dry.",
        claims: ["portable"]
      }
    });

    expect(report.verdict).toBe("CAUTION");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-011"]);
    expect(report.missingFacts).toEqual(["maxWeightKg"]);
  });

  it("builds deterministic hashes from canonical request and report data", () => {
    const firstReport = auditProduct(clearCatCollarFixture);
    const secondReport = auditProduct({
      product: { ...clearCatCollarFixture.product },
      pet: { ...clearCatCollarFixture.pet }
    });

    expect(firstReport.receipt.algorithm).toBe("sha256");
    expect(firstReport.receipt.inputHash).toHaveLength(64);
    expect(firstReport.receipt.reportHash).toHaveLength(64);
    expect(firstReport.receipt).toEqual(secondReport.receipt);
    expect(firstReport).toEqual(secondReport);
  });

  it("routes unsupported scope to human review while preserving all findings and unique penalties", () => {
    const report = auditProduct({
      pet: {
        species: "cat",
        lifeStage: "adult",
        weightKg: 8.2,
        traits: ["strong_chewer"]
      },
      product: {
        name: "Dog Adventure Carrier",
        category: "carrier",
        intendedSpecies: ["dog"],
        materials: [],
        minWeightKg: 1,
        maxWeightKg: 5,
        containsMagnet: true,
        claims: ["anti-inflammatory"],
        hasDetachableParts: true
      }
    });

    expect(report.verdict).toBe("HUMAN_REVIEW");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual([
      "PS-001",
      "PS-007",
      "PS-005",
      "PS-008",
      "PS-003",
      "PS-009"
    ]);
    expect(report.score).toBe(0);
  });
});
