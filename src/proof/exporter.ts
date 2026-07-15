import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { z } from "zod";

import { RULESET_VERSION } from "../domain/rules";
import { collectGitSourceEvidence } from "./git-provenance";
import {
  EXPECTED_PUBLIC_ORIGIN,
  PROOF_SOURCE_PATHS,
  buildProof,
  type DeploymentAttestation,
  type PawSiftProof
} from "./proof";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

const deploymentConfigSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("pending") }).strict(),
  z
    .object({
      status: z.literal("live"),
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
          inputHash: z.string().regex(SHA256_PATTERN),
          reportHash: z.string().regex(SHA256_PATTERN)
        })
        .strict(),
      evidencePath: z.literal("ops/DEPLOYMENT.md")
    })
    .strict()
]);

const proofExportConfigSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    auditedCommit: z.string().regex(/^[0-9a-f]{40}$/, "Expected a full lowercase Git commit"),
    deployment: deploymentConfigSchema
  })
  .strict();

export type ProofExportConfig = z.infer<typeof proofExportConfigSchema>;

function git(repository: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repository,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

export function parseProofExportConfig(value: unknown): ProofExportConfig {
  return proofExportConfigSchema.parse(value);
}

export function readProofExportConfig(path: string): ProofExportConfig {
  return parseProofExportConfig(JSON.parse(readFileSync(path, "utf8")));
}

export function buildProofFromRepository(
  repository: string,
  config: ProofExportConfig
): PawSiftProof {
  const sourceFiles = collectGitSourceEvidence(
    repository,
    config.auditedCommit,
    PROOF_SOURCE_PATHS
  );
  const generatedAt = git(repository, [
    "show",
    "-s",
    "--format=%cI",
    config.auditedCommit
  ]);

  let deploymentAttestation: DeploymentAttestation | undefined;
  if (config.deployment.status === "live") {
    const deployment = config.deployment;
    const evidence = sourceFiles.find(
      (file) => file.path === deployment.evidencePath
    );
    if (!evidence) {
      throw new Error(`Deployment evidence is not an audited source: ${deployment.evidencePath}`);
    }

    deploymentAttestation = {
      endpoint: deployment.endpoint,
      verifiedAt: deployment.verifiedAt,
      health: deployment.health,
      fixture: deployment.fixture,
      evidencePath: deployment.evidencePath,
      evidenceSha256: evidence.sha256
    };
  }

  return buildProof({
    auditedCommit: config.auditedCommit,
    generatedAt,
    sourceFiles,
    deploymentAttestation
  });
}
