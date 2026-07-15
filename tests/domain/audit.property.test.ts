import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { auditProduct } from "../../src/domain/audit";
import { clearCatCollarFixture } from "../../src/domain/fixtures";
import { auditRequestSchema, type AuditRequest, type Verdict } from "../../src/domain/schemas";

const severityRank: Record<Verdict, number> = {
  BLOCK: 0,
  HUMAN_REVIEW: 1,
  CAUTION: 2,
  CLEAR: 3
};

const textArb = fc.constantFrom(
  "adult",
  "senior",
  "kitten",
  "puppy",
  "travel",
  "indoor",
  "reflective",
  "washable",
  "mesh",
  "nylon",
  "plush",
  "ventilated",
  "gentle",
  "portable",
  "chewer"
);
const claimsArb = fc.uniqueArray(
  fc.constantFrom(
    "adjustable",
    "reflective",
    "washable",
    "travel ready",
    "anti-inflammatory",
    "calming support",
    "edible topper",
    "ventilated",
    "lightweight"
  ),
  { maxLength: 4 }
);
const materialsArb = fc.uniqueArray(
  fc.constantFrom(
    "nylon",
    "mesh",
    "rubber",
    "plush",
    "abs_plastic",
    "stainless_steel",
    "bamboo",
    "canvas"
  ),
  { maxLength: 3 }
);
const speciesArb = fc.constantFrom("cat" as const, "dog" as const);
const categoryArb = fc.constantFrom(
  "toy" as const,
  "carrier" as const,
  "bed" as const,
  "feeder" as const,
  "collar_harness" as const,
  "grooming_tool" as const
);
const weightArb = fc
  .double({
    min: 0,
    max: 30,
    noNaN: true,
    noDefaultInfinity: true
  })
  .map((value) => Number(value.toFixed(1)));
const whitespaceTextArb = fc
  .array(fc.constantFrom(" ", "\t"), { minLength: 1, maxLength: 6 })
  .map((tokens) => tokens.join(""));

function optionalFragmentArb<T extends object>(
  arb: fc.Arbitrary<T>
): fc.Arbitrary<T | Record<string, never>> {
  return fc.oneof(fc.constant({}), arb);
}

function reorderKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => reorderKeysDeep(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reverse()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = reorderKeysDeep((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}

const petArb = fc.record({
  species: speciesArb,
  lifeStage: textArb,
  weightKg: weightArb,
  traits: fc.uniqueArray(textArb, { maxLength: 3 })
});

const weightRangeFragmentArb = fc.oneof(
  fc.constant({}),
  weightArb.map((minWeightKg) => ({ minWeightKg })),
  weightArb.map((maxWeightKg) => ({ maxWeightKg })),
  fc.tuple(weightArb, weightArb).map(([left, right]) => ({
    minWeightKg: Math.min(left, right),
    maxWeightKg: Math.max(left, right)
  }))
);
const dimensionsFragmentArb = optionalFragmentArb(
  fc.record({
    dimensionsCm: fc.record({
      lengthCm: weightArb,
      widthCm: weightArb,
      heightCm: weightArb
    })
  })
);
const breakawayFragmentArb = optionalFragmentArb(
  fc.boolean().map((breakaway) => ({ breakaway }))
);
const detachablePartsFragmentArb = optionalFragmentArb(
  fc.boolean().map((hasDetachableParts) => ({ hasDetachableParts }))
);
const supervisionFragmentArb = optionalFragmentArb(
  textArb.map((token) => ({ supervisionStatement: `Supervise ${token} play.` }))
);
const batteryFragmentArb = optionalFragmentArb(
  fc.boolean().map((containsBattery) => ({ containsBattery }))
);
const magnetFragmentArb = optionalFragmentArb(
  fc.boolean().map((containsMagnet) => ({ containsMagnet }))
);
const careInstructionsFragmentArb = optionalFragmentArb(
  textArb.map((token) => ({ careInstructions: `Wipe clean after ${token} use.` }))
);

const productArb = fc
  .tuple(
    textArb,
    categoryArb,
    fc.uniqueArray(speciesArb, { minLength: 1, maxLength: 2 }),
    materialsArb,
    weightRangeFragmentArb,
    dimensionsFragmentArb,
    breakawayFragmentArb,
    detachablePartsFragmentArb,
    supervisionFragmentArb,
    batteryFragmentArb,
    magnetFragmentArb,
    careInstructionsFragmentArb,
    claimsArb
  )
  .map(
    ([
      nameToken,
      category,
      intendedSpecies,
      materials,
      weightRange,
      dimensions,
      breakaway,
      detachableParts,
      supervision,
      battery,
      magnet,
      careInstructions,
      claims
    ]) => ({
      name: `${nameToken} product`,
      category,
      intendedSpecies,
      materials,
      claims,
      ...weightRange,
      ...dimensions,
      ...breakaway,
      ...detachableParts,
      ...supervision,
      ...battery,
      ...magnet,
      ...careInstructions
    })
  );

const auditRequestArb: fc.Arbitrary<AuditRequest> = fc
  .tuple(petArb, productArb)
  .map(([pet, product]) => auditRequestSchema.parse({ pet, product }));

describe("auditProduct property checks", () => {
  it("keeps scores within 0 to 100 for generated valid requests", () => {
    fc.assert(
      fc.property(auditRequestArb, (request) => {
        const report = auditProduct(request);

        expect(report.score).toBeGreaterThanOrEqual(0);
        expect(report.score).toBeLessThanOrEqual(100);
      })
    );
  });

  it("emits deterministic hashes and reports for identical requests", () => {
    fc.assert(
      fc.property(auditRequestArb, (request) => {
        const firstReport = auditProduct(request);
        const secondReport = auditProduct(request);

        expect(secondReport).toEqual(firstReport);
      })
    );
  });

  it("sorts findings by severity then rule id", () => {
    fc.assert(
      fc.property(auditRequestArb, (request) => {
        const findings = auditProduct(request).findings;

        for (let index = 1; index < findings.length; index += 1) {
          const previous = findings[index - 1];
          const current = findings[index];

          const previousRank = severityRank[previous.severity];
          const currentRank = severityRank[current.severity];

          expect(previousRank <= currentRank).toBe(true);

          if (previousRank === currentRank) {
            expect(previous.ruleId <= current.ruleId).toBe(true);
          }
        }
      })
    );
  });

  it("keeps verdicts and receipts unchanged when object key order changes", () => {
    fc.assert(
      fc.property(auditRequestArb, (request) => {
        const baseline = auditProduct(request);
        const reordered = auditProduct(reorderKeysDeep(request) as AuditRequest);

        expect(reordered).toEqual(baseline);
      })
    );
  });

  it("rejects whitespace-only materials before they can count as supplied facts", () => {
    fc.assert(
      fc.property(fc.array(whitespaceTextArb, { minLength: 1, maxLength: 3 }), (materials) => {
        expect(() =>
          auditProduct({
            pet: clearCatCollarFixture.pet,
            product: {
              ...clearCatCollarFixture.product,
              materials
            }
          })
        ).toThrow();
      })
    );
  });

  it("routes generated safe-to-eat phrasing to PS-008 without falling through to clear", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("safe", "Safe", "SAFE"),
        fc.constantFrom("to", "To", "TO"),
        fc.constantFrom("eat", "Eat", "EAT"),
        fc.array(fc.constantFrom(" ", "\t"), { minLength: 1, maxLength: 3 }).map((tokens) =>
          tokens.join("")
        ),
        fc.array(fc.constantFrom(" ", "\t"), { minLength: 1, maxLength: 3 }).map((tokens) =>
          tokens.join("")
        ),
        fc.array(textArb, { maxLength: 2 }),
        fc.array(textArb, { maxLength: 2 }),
        (safeWord, toWord, eatWord, separatorOne, separatorTwo, prefixTokens, suffixTokens) => {
          const prefix = prefixTokens.join(" ");
          const suffix = suffixTokens.join(" ");
          const claim = [prefix, `${safeWord}${separatorOne}${toWord}${separatorTwo}${eatWord}`, suffix]
            .filter((segment) => segment.length > 0)
            .join(" ");

          const report = auditProduct({
            pet: clearCatCollarFixture.pet,
            product: {
              ...clearCatCollarFixture.product,
              claims: [claim]
            }
          });

          expect(report.verdict).toBe("HUMAN_REVIEW");
          expect(report.findings.map((finding) => finding.ruleId)).toEqual(["PS-008"]);
        }
      )
    );
  });
});
