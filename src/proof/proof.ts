import { z } from "zod";

import { auditProduct } from "../domain/audit";
import { canonicalize, sha256 } from "../domain/canonical";
import { AUDIT_FIXTURES } from "../domain/fixtures";
import { RULESET_VERSION } from "../domain/rules";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const GIT_BLOB_PATTERN = /^[0-9a-f]{40}$/;

export const EXPECTED_PUBLIC_ORIGIN = "https://pawsift.vercel.app";

export const PROOF_SOURCE_PATHS = [
  "docs/SAFETY.md",
  "ops/DEPLOYMENT.md",
  "package.json",
  "scripts/export-proof.ts",
  "src/domain/audit.ts",
  "src/domain/canonical-json.ts",
  "src/domain/canonical.ts",
  "src/domain/fixtures.ts",
  "src/domain/rules.ts",
  "src/domain/schemas.ts",
  "src/proof/exporter.ts",
  "src/proof/git-provenance.ts",
  "src/proof/proof.ts",
  "tests/domain/canonical.test.ts",
  "tests/domain/rules.test.ts",
  "tests/proof/git-provenance.test.ts",
  "tests/proof/proof.test.ts"
] as const;

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

const sourceFileSchema = z
  .object({
    path: sourcePathSchema,
    gitBlob: z.string().regex(GIT_BLOB_PATTERN, "Expected a full Git blob identifier"),
    sha256: sha256Schema
  })
  .strict();

const deploymentAttestationSchema = z
  .object({
    endpoint: z.literal(EXPECTED_PUBLIC_ORIGIN),
    verifiedAt: z.string().datetime({ offset: true }),
    health: z
      .object({
        url: z.literal(`${EXPECTED_PUBLIC_ORIGIN}/api/v1/health`),
        status: z.literal("ok"),
        rulesetVersion: z.literal(RULESET_VERSION)
      })
      .strict(),
    fixture: z
      .object({
        id: z.literal("clear-cat-collar"),
        inputHash: sha256Schema,
        reportHash: sha256Schema
      })
      .strict(),
    evidencePath: z.literal("ops/DEPLOYMENT.md"),
    evidenceSha256: sha256Schema
  })
  .strict();

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
      endpoint: z.literal(EXPECTED_PUBLIC_ORIGIN),
      paymentMode: z.literal("free_launch"),
      verification: deploymentAttestationSchema
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
        fixtureSource: sourcePathSchema,
        files: z.array(sourceFileSchema)
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
export type SourceFileEvidence = z.infer<typeof sourceFileSchema>;
export type DeploymentAttestation = z.infer<typeof deploymentAttestationSchema>;

export type ProofBuildContext = {
  auditedCommit: string;
  generatedAt: string;
  sourceFiles: SourceFileEvidence[];
  deploymentAttestation?: DeploymentAttestation;
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

function assertCompleteSourceProvenance(sourceFiles: SourceFileEvidence[]): void {
  const receivedPaths = sourceFiles.map((file) => file.path);
  const uniquePaths = new Set(receivedPaths);
  const hasExactPaths =
    receivedPaths.length === PROOF_SOURCE_PATHS.length &&
    uniquePaths.size === PROOF_SOURCE_PATHS.length &&
    PROOF_SOURCE_PATHS.every((path) => uniquePaths.has(path));

  if (!hasExactPaths) {
    throw new Error("Source provenance must cover every proof-critical path exactly once");
  }
}

function normalizeSourceFiles(sourceFiles: SourceFileEvidence[]): SourceFileEvidence[] {
  assertCompleteSourceProvenance(sourceFiles);
  const byPath = new Map(sourceFiles.map((file) => [file.path, file]));
  return PROOF_SOURCE_PATHS.map((path) => sourceFileSchema.parse(byPath.get(path)));
}

function assertClaimSourcesAreAudited(proof: z.infer<typeof proofBaseSchema>): void {
  const auditedPaths = new Set(proof.source.files.map((file) => file.path));
  const structuralSources = [proof.source.rulesSource, proof.source.fixtureSource];
  const claimSources = proof.claims.flatMap((claim) => claim.sourcePaths);

  for (const path of [...structuralSources, ...claimSources]) {
    if (!auditedPaths.has(path)) {
      throw new Error(`Claim source is not bound to the audited commit: ${path}`);
    }
  }
}

function assertDeploymentEvidence(proof: z.infer<typeof proofBaseSchema>): void {
  if (proof.deployment.status !== "live") {
    return;
  }

  const deployment = proof.deployment;
  const clearFixture = proof.fixtures.find(
    (fixture) => fixture.id === deployment.verification.fixture.id
  );
  if (
    !clearFixture ||
    clearFixture.inputHash !== deployment.verification.fixture.inputHash ||
    clearFixture.reportHash !== deployment.verification.fixture.reportHash
  ) {
    throw new Error("Live deployment fixture does not match the audited proof fixture");
  }

  const deploymentEvidence = proof.source.files.find(
    (file) => file.path === deployment.verification.evidencePath
  );
  if (deploymentEvidence?.sha256 !== deployment.verification.evidenceSha256) {
    throw new Error("Live deployment evidence digest is not bound to the audited source");
  }
}

export function buildProof(context: ProofBuildContext): PawSiftProof {
  if (
    context.deploymentAttestation &&
    context.deploymentAttestation.endpoint !== EXPECTED_PUBLIC_ORIGIN
  ) {
    throw new Error(`Live deployment must use the PawSift production origin: ${EXPECTED_PUBLIC_ORIGIN}`);
  }

  const sourceFiles = normalizeSourceFiles(context.sourceFiles);
  const deployment = context.deploymentAttestation
    ? {
        status: "live" as const,
        endpoint: EXPECTED_PUBLIC_ORIGIN,
        paymentMode: "free_launch" as const,
        verification: context.deploymentAttestation
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
      fixtureSource: "src/domain/fixtures.ts",
      files: sourceFiles
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

  assertClaimSourcesAreAudited(base);
  assertDeploymentEvidence(base);

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

  assertCompleteSourceProvenance(proof.source.files);
  assertClaimSourcesAreAudited(proof);

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

  assertDeploymentEvidence(proof);

  const { documentHash, ...base } = proof;
  if (documentHash !== documentHashFor(proofBaseSchema.parse(base))) {
    throw new Error("Document hash does not match the proof payload");
  }

  return proof;
}

export function serializeProof(proof: PawSiftProof): string {
  return `${JSON.stringify(validateProof(proof), null, 2)}\n`;
}
