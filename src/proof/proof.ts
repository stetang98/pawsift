import { z } from "zod";

import { auditProduct } from "../domain/audit";
import { canonicalize, sha256 } from "../domain/canonical";
import { AUDIT_FIXTURES } from "../domain/fixtures";
import { RULESET_VERSION } from "../domain/rules";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;

const sha256Schema = z.string().regex(SHA256_PATTERN, "Expected lowercase SHA-256 hash");
const sourcePathSchema = z
  .string()
  .min(1)
  .refine(
    (value) => !value.startsWith("/") && !value.split("/").includes(".."),
    "sourcePaths must be repository-relative"
  );
const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:", "Live endpoint must use HTTPS");

const deploymentSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("pending"),
      paymentMode: z.literal("free_launch")
    })
    .strict(),
  z
    .object({
      status: z.literal("live"),
      endpoint: httpsUrlSchema,
      paymentMode: z.literal("free_launch")
    })
    .strict()
]);

const proofBaseSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    project: z
      .object({
        name: z.literal("PawSift"),
        track: z.literal("Lifestyle Companion"),
        repository: httpsUrlSchema,
        license: z.literal("MIT")
      })
      .strict(),
    source: z
      .object({
        auditedCommit: z.string().regex(GIT_COMMIT_PATTERN, "auditedCommit must be a full commit"),
        generatedAt: z.string().datetime({ offset: true }),
        rulesetVersion: z.string().min(1),
        rulesSource: sourcePathSchema,
        fixtureSource: sourcePathSchema
      })
      .strict(),
    deployment: deploymentSchema,
    payments: z
      .object({
        mode: z.literal("free_launch"),
        observedSales: z.literal(0),
        transactionHashes: z.array(z.string()).max(0, "transactionHashes must stay empty at launch")
      })
      .strict(),
    claims: z
      .array(
        z
          .object({
            statement: z.string().min(1),
            sourcePaths: z.array(sourcePathSchema).min(1, "sourcePaths cannot be empty")
          })
          .strict()
      )
      .min(1),
    fixtures: z.array(
      z
        .object({
          id: z.string().min(1),
          expectedVerdict: z.enum(["CLEAR", "CAUTION", "BLOCK", "HUMAN_REVIEW"]),
          actualVerdict: z.enum(["CLEAR", "CAUTION", "BLOCK", "HUMAN_REVIEW"]),
          expectedRuleIds: z.array(z.string()),
          actualRuleIds: z.array(z.string()),
          inputHash: sha256Schema,
          reportHash: sha256Schema
        })
        .strict()
    ),
    verification: z
      .object({
        commands: z.array(z.string().min(1)).min(1)
      })
      .strict()
  })
  .strict();

export const proofSchema = proofBaseSchema.extend({
  documentHash: sha256Schema
});

export type PawSiftProof = z.infer<typeof proofSchema>;

export type ProofBuildContext = {
  auditedCommit: string;
  generatedAt: string;
  publicUrl?: string;
};

function buildFixtureEvidence() {
  return AUDIT_FIXTURES.map((fixture) => {
    const result = auditProduct(fixture.request);

    return {
      id: fixture.id,
      expectedVerdict: fixture.expectedVerdict,
      actualVerdict: result.verdict,
      expectedRuleIds: [...fixture.expectedRuleIds],
      actualRuleIds: result.findings.map((finding) => finding.ruleId),
      inputHash: result.receipt.inputHash,
      reportHash: result.receipt.reportHash
    };
  });
}

function documentHashFor(base: z.infer<typeof proofBaseSchema>): string {
  return sha256(canonicalize(base));
}

export function buildProof(context: ProofBuildContext): PawSiftProof {
  const deployment = context.publicUrl
    ? {
        status: "live" as const,
        endpoint: context.publicUrl,
        paymentMode: "free_launch" as const
      }
    : {
        status: "pending" as const,
        paymentMode: "free_launch" as const
      };

  const base = proofBaseSchema.parse({
    schemaVersion: "1.0.0",
    project: {
      name: "PawSift",
      track: "Lifestyle Companion",
      repository: "https://github.com/stetang98/pawsift",
      license: "MIT"
    },
    source: {
      auditedCommit: context.auditedCommit,
      generatedAt: context.generatedAt,
      rulesetVersion: RULESET_VERSION,
      rulesSource: "src/domain/rules.ts",
      fixtureSource: "src/domain/fixtures.ts"
    },
    deployment,
    payments: {
      mode: "free_launch",
      observedSales: 0,
      transactionHashes: []
    },
    claims: [
      {
        statement:
          "All ten published fixtures reproduce their expected verdicts and stable rule identifiers.",
        sourcePaths: ["src/domain/fixtures.ts", "tests/domain/rules.test.ts"]
      },
      {
        statement:
          "Each audit receipt hashes canonical input and report JSON with lowercase SHA-256.",
        sourcePaths: [
          "src/domain/audit.ts",
          "src/domain/canonical-json.ts",
          "tests/domain/canonical.test.ts"
        ]
      },
      {
        statement:
          "PawSift is a non-veterinary product-fit audit and routes unsupported medical or ingestible claims to human review.",
        sourcePaths: ["src/domain/rules.ts", "docs/SAFETY.md"]
      }
    ],
    fixtures: buildFixtureEvidence(),
    verification: {
      commands: [
        "npm ci",
        "npm run check",
        "npm run test:e2e",
        "npm run proof",
        "npm test -- --run tests/proof/proof.test.ts"
      ]
    }
  });

  return proofSchema.parse({
    ...base,
    documentHash: documentHashFor(base)
  });
}

export function validateProof(value: unknown): PawSiftProof {
  const proof = proofSchema.parse(value);

  if (proof.source.rulesetVersion !== RULESET_VERSION) {
    throw new Error(`Unrecognized ruleset: ${proof.source.rulesetVersion}`);
  }

  const expectedFixtures = new Map(AUDIT_FIXTURES.map((fixture) => [fixture.id, fixture]));

  if (proof.fixtures.length !== expectedFixtures.size) {
    throw new Error("Fixture evidence must cover the complete published fixture deck");
  }

  const seenIds = new Set<string>();
  for (const evidence of proof.fixtures) {
    const fixture = expectedFixtures.get(evidence.id);
    if (!fixture || seenIds.has(evidence.id)) {
      throw new Error(`Unknown or duplicate fixture evidence: ${evidence.id}`);
    }

    seenIds.add(evidence.id);
    const result = auditProduct(fixture.request);
    const expected = {
      id: fixture.id,
      expectedVerdict: fixture.expectedVerdict,
      actualVerdict: result.verdict,
      expectedRuleIds: [...fixture.expectedRuleIds],
      actualRuleIds: result.findings.map((finding) => finding.ruleId),
      inputHash: result.receipt.inputHash,
      reportHash: result.receipt.reportHash
    };

    if (canonicalize(evidence) !== canonicalize(expected)) {
      throw new Error(`Fixture hash or outcome mismatch: ${evidence.id}`);
    }
  }

  const { documentHash, ...base } = proof;
  if (documentHash !== documentHashFor(proofBaseSchema.parse(base))) {
    throw new Error("Document hash does not match the proof payload");
  }

  return proof;
}

export function serializeProof(proof: PawSiftProof): string {
  return `${JSON.stringify(validateProof(proof), null, 2)}\n`;
}
