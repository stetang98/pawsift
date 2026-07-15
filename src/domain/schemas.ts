import { z } from "zod";

const MAX_TEXT_LENGTH = 500;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

const boundedText = z.string().trim().min(1).max(MAX_TEXT_LENGTH);
const boundedTextList = z.array(boundedText).max(MAX_TEXT_LENGTH);
const finiteNumber = z.number().finite();
const nonNegativeNumber = finiteNumber.min(0);

export const speciesSchema = z.enum(["cat", "dog"]);
export const categorySchema = z.enum([
  "toy",
  "carrier",
  "bed",
  "feeder",
  "collar_harness",
  "grooming_tool"
]);
export const verdictSchema = z.enum([
  "CLEAR",
  "CAUTION",
  "BLOCK",
  "HUMAN_REVIEW"
]);

export const petSchema = z
  .object({
    species: speciesSchema,
    lifeStage: boundedText,
    weightKg: nonNegativeNumber,
    traits: boundedTextList.default([])
  })
  .strict();

export const dimensionsSchema = z
  .object({
    lengthCm: nonNegativeNumber.optional(),
    widthCm: nonNegativeNumber.optional(),
    heightCm: nonNegativeNumber.optional()
  })
  .strict();

export const productSchema = z
  .object({
    name: boundedText,
    category: categorySchema,
    intendedSpecies: z.array(speciesSchema).min(1).max(2),
    materials: boundedTextList.default([]),
    minWeightKg: nonNegativeNumber.optional(),
    maxWeightKg: nonNegativeNumber.optional(),
    dimensionsCm: dimensionsSchema.optional(),
    breakaway: z.boolean().optional(),
    hasDetachableParts: z.boolean().optional(),
    supervisionStatement: boundedText.optional(),
    containsBattery: z.boolean().optional(),
    containsMagnet: z.boolean().optional(),
    careInstructions: boundedText.optional(),
    claims: boundedTextList.default([])
  })
  .strict()
  .refine(
    (value) =>
      value.minWeightKg === undefined ||
      value.maxWeightKg === undefined ||
      value.minWeightKg <= value.maxWeightKg,
    {
      message: "minWeightKg must be less than or equal to maxWeightKg",
      path: ["minWeightKg"]
    }
  );

export const auditRequestSchema = z
  .object({
    pet: petSchema,
    product: productSchema
  })
  .strict();

export const findingSchema = z
  .object({
    ruleId: boundedText,
    severity: verdictSchema,
    title: boundedText,
    reason: boundedText,
    evidence: boundedTextList,
    remediation: boundedText
  })
  .strict();

export const receiptSchema = z
  .object({
    algorithm: z.literal("sha256"),
    inputHash: z.string().regex(SHA256_PATTERN, "Expected lowercase sha256 hash"),
    reportHash: z.string().regex(SHA256_PATTERN, "Expected lowercase sha256 hash")
  })
  .strict();

export const auditResponseSchema = z
  .object({
    verdict: verdictSchema,
    score: z.number().int().min(0).max(100),
    rulesetVersion: boundedText,
    findings: z.array(findingSchema),
    missingFacts: boundedTextList,
    ownerQuestions: boundedTextList,
    listingPatch: boundedTextList,
    boundary: boundedText,
    receipt: receiptSchema
  })
  .strict();

export type Species = z.infer<typeof speciesSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Verdict = z.infer<typeof verdictSchema>;
export type Pet = z.infer<typeof petSchema>;
export type Product = z.infer<typeof productSchema>;
export type AuditRequest = z.infer<typeof auditRequestSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
export type AuditResponse = z.infer<typeof auditResponseSchema>;
