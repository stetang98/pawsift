import { describe, expect, it } from "vitest";

import {
  auditRequestSchema,
  auditResponseSchema,
  findingSchema,
  verdictSchema
} from "../../src/domain/schemas";

const validPet = {
  species: "cat",
  lifeStage: "adult",
  weightKg: 4.8,
  traits: ["strong_chewer"]
} as const;

const validProduct = {
  name: "Breakaway Reflective Collar",
  category: "collar_harness",
  intendedSpecies: ["cat"],
  materials: ["nylon", "zinc_alloy"],
  minWeightKg: 2.5,
  maxWeightKg: 7,
  breakaway: true,
  careInstructions: "Hand wash and air dry",
  claims: ["adjustable", "reflective"]
} as const;

const validFinding = {
  ruleId: "PS-006",
  severity: "CAUTION",
  title: "Breakaway status missing",
  reason: "Cat collars should declare whether they include a breakaway release.",
  evidence: ["category=collar_harness", "species=cat"],
  remediation: "State whether the collar has a breakaway release."
} as const;

describe("auditRequestSchema", () => {
  it("accepts a supported non-ingestible pet supply request", () => {
    const parsed = auditRequestSchema.parse({
      pet: validPet,
      product: validProduct
    });

    expect(parsed).toEqual({
      pet: validPet,
      product: validProduct
    });
  });

  it("rejects ingestible categories", () => {
    expect(() =>
      auditRequestSchema.parse({
        pet: validPet,
        product: { ...validProduct, category: "food" }
      })
    ).toThrow();
  });

  it("rejects unsupported species", () => {
    expect(() =>
      auditRequestSchema.parse({
        pet: { ...validPet, species: "rabbit" },
        product: validProduct
      })
    ).toThrow();
  });

  it("rejects unknown keys at the request boundary", () => {
    expect(() =>
      auditRequestSchema.parse({
        pet: { ...validPet, nickname: "Mochi" },
        product: validProduct
      })
    ).toThrow();

    expect(() =>
      auditRequestSchema.parse({
        pet: validPet,
        product: validProduct,
        extra: true
      })
    ).toThrow();
  });

  it("rejects non-finite numbers in the request", () => {
    expect(() =>
      auditRequestSchema.parse({
        pet: { ...validPet, weightKg: Number.POSITIVE_INFINITY },
        product: validProduct
      })
    ).toThrow();

    expect(() =>
      auditRequestSchema.parse({
        pet: validPet,
        product: { ...validProduct, minWeightKg: Number.NaN }
      })
    ).toThrow();
  });

  it("caps free text fields at 500 characters", () => {
    const overLimit = "x".repeat(501);

    expect(() =>
      auditRequestSchema.parse({
        pet: validPet,
        product: { ...validProduct, careInstructions: overLimit }
      })
    ).toThrow();

    expect(() =>
      auditRequestSchema.parse({
        pet: { ...validPet, traits: [overLimit] },
        product: validProduct
      })
    ).toThrow();
  });

  it("trims bounded text and rejects whitespace-only entries", () => {
    const parsed = auditRequestSchema.parse({
      pet: { ...validPet, lifeStage: "  adult  ", traits: ["  strong_chewer  "] },
      product: {
        ...validProduct,
        name: "  Breakaway Reflective Collar  ",
        materials: ["  nylon  ", "  zinc_alloy  "],
        careInstructions: "  Hand wash and air dry  ",
        claims: ["  adjustable  "]
      }
    });

    expect(parsed).toEqual({
      pet: {
        ...validPet,
        lifeStage: "adult",
        traits: ["strong_chewer"]
      },
      product: {
        ...validProduct,
        name: "Breakaway Reflective Collar",
        materials: ["nylon", "zinc_alloy"],
        careInstructions: "Hand wash and air dry",
        claims: ["adjustable"]
      }
    });

    expect(() =>
      auditRequestSchema.parse({
        pet: validPet,
        product: {
          ...validProduct,
          materials: ["   "]
        }
      })
    ).toThrow();
  });
});

describe("verdictSchema", () => {
  it("accepts the documented verdicts", () => {
    expect(verdictSchema.parse("CLEAR")).toBe("CLEAR");
    expect(verdictSchema.parse("CAUTION")).toBe("CAUTION");
    expect(verdictSchema.parse("BLOCK")).toBe("BLOCK");
    expect(verdictSchema.parse("HUMAN_REVIEW")).toBe("HUMAN_REVIEW");
  });

  it("rejects undocumented verdicts", () => {
    expect(() => verdictSchema.parse("WARN")).toThrow();
  });
});

describe("findingSchema", () => {
  it("accepts a complete finding", () => {
    expect(findingSchema.parse(validFinding)).toEqual(validFinding);
  });

  it("caps free text on finding fields", () => {
    expect(() =>
      findingSchema.parse({
        ...validFinding,
        title: "x".repeat(501)
      })
    ).toThrow();
  });
});

describe("auditResponseSchema", () => {
  it("accepts a canonical response payload", () => {
    const response = {
      verdict: "CLEAR",
      score: 92,
      rulesetVersion: "2026.07.1",
      findings: [],
      missingFacts: [],
      ownerQuestions: [],
      listingPatch: [],
      boundary: "Non-veterinary product-fit audit based only on supplied facts.",
      receipt: {
        algorithm: "sha256",
        inputHash:
          "7e6b7db4a5f62f76f3946ef8869b0a6d3df4aa4ce6d57f765c2f2b932a0b501f",
        reportHash:
          "ef8056d495d6d9dfe7fb4c84c6d52572a8416db537bcb5f7f0ce562f6ca8f5cb"
      }
    };

    expect(auditResponseSchema.parse(response)).toEqual(response);
  });

  it("rejects response hashes that are not lowercase sha256 strings", () => {
    expect(() =>
      auditResponseSchema.parse({
        verdict: "CAUTION",
        score: 85,
        rulesetVersion: "2026.07.1",
        findings: [validFinding],
        missingFacts: [],
        ownerQuestions: [],
        listingPatch: [],
        boundary: "Non-veterinary product-fit audit based only on supplied facts.",
        receipt: {
          algorithm: "sha256",
          inputHash: "ABC",
          reportHash: "123"
        }
      })
    ).toThrow();
  });
});
