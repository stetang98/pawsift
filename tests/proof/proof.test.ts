import { describe, expect, it } from "vitest";

import {
  EXPECTED_PUBLIC_ORIGIN,
  PROOF_SOURCE_PATHS,
  buildProof,
  serializeProof,
  validateProof,
  type DeploymentAttestation
} from "../../src/proof/proof";

const sourceFiles = PROOF_SOURCE_PATHS.map((path, index) => ({
  path,
  gitBlob: index.toString(16).padStart(40, "a").slice(-40),
  sha256: index.toString(16).padStart(64, "b").slice(-64)
}));

const context = {
  auditedCommit: "a".repeat(40),
  generatedAt: "2026-07-15T18:00:00Z",
  sourceFiles
};

const deploymentAttestation = {
  endpoint: EXPECTED_PUBLIC_ORIGIN,
  verifiedAt: "2026-07-15T23:10:27Z",
  health: {
    url: `${EXPECTED_PUBLIC_ORIGIN}/api/v1/health`,
    status: "ok" as const,
    rulesetVersion: "2026.07.2"
  },
  fixture: {
    id: "clear-cat-collar" as const,
    inputHash: "f8ab57435e1fb63b7fda95d06437c263ef87e1c63051e723e39ee56797eff5ff",
    reportHash: "f5bd2cbcb24b55469243c036ef20a7bedb0bd085d4af5435dbecda6cf69a97e2"
  },
  evidencePath: "ops/DEPLOYMENT.md",
  evidenceSha256: sourceFiles.find((file) => file.path === "ops/DEPLOYMENT.md")!.sha256
} satisfies DeploymentAttestation;

function cloneProof() {
  return structuredClone(buildProof(context));
}

describe("PawSift proof", () => {
  it("builds a proof that validates against the audited fixtures", () => {
    const proof = buildProof(context);

    expect(validateProof(proof)).toEqual(proof);
    expect(proof.fixtures).toHaveLength(11);
    expect(proof.fixtures.find((fixture) => fixture.id === "missing-weight-support")).toMatchObject({
      expectedVerdict: "CAUTION",
      actualVerdict: "CAUTION",
      expectedRuleIds: ["PS-011"],
      actualRuleIds: ["PS-011"]
    });
    expect(proof.claims[0]?.statement).toContain("eleven published fixtures");
    expect(proof.payments).toEqual({
      mode: "free_launch",
      observedSales: 0,
      transactionHashes: []
    });
  });

  it("serializes deterministically as newline-terminated JSON", () => {
    const proof = buildProof(context);

    expect(serializeProof(proof)).toBe(`${JSON.stringify(proof, null, 2)}\n`);
  });

  it("rejects a missing audited commit", () => {
    const proof = cloneProof();
    proof.source.auditedCommit = "";

    expect(() => validateProof(proof)).toThrow(/auditedCommit/i);
  });

  it("emits live status only from the verified PawSift deployment attestation", () => {
    const proof = buildProof({ ...context, deploymentAttestation });

    expect(proof.deployment.status).toBe("live");
    expect(proof.deployment).toMatchObject({
      endpoint: EXPECTED_PUBLIC_ORIGIN,
      paymentMode: "free_launch",
      verification: deploymentAttestation
    });
  });

  it("rejects an arbitrary HTTPS URL as live deployment evidence", () => {
    const invalidAttestation = {
      ...deploymentAttestation,
      endpoint: "https://example.com"
    } as unknown as DeploymentAttestation;

    expect(() =>
      buildProof({
        ...context,
        deploymentAttestation: invalidAttestation
      })
    ).toThrow(/PawSift production origin/i);
  });

  it("rejects deployment evidence that is not bound to the audited source digest", () => {
    expect(() =>
      buildProof({
        ...context,
        deploymentAttestation: {
          ...deploymentAttestation,
          evidenceSha256: "e".repeat(64)
        }
      })
    ).toThrow(/deployment evidence digest/i);
  });

  it("requires complete source provenance for every proof-critical path", () => {
    expect(() => buildProof({ ...context, sourceFiles: sourceFiles.slice(1) })).toThrow(
      /source provenance/i
    );
  });

  it("rejects an unrecognized ruleset", () => {
    const proof = cloneProof();
    proof.source.rulesetVersion = "unrecognized";

    expect(() => validateProof(proof)).toThrow(/ruleset/i);
  });

  it("rejects a fixture hash that does not match the audit engine", () => {
    const proof = cloneProof();
    proof.fixtures[0].inputHash = "b".repeat(64);

    expect(() => validateProof(proof)).toThrow(/fixture.*hash/i);
  });

  it("rejects fake sales counts", () => {
    const proof = cloneProof() as ReturnType<typeof buildProof> & {
      payments: ReturnType<typeof buildProof>["payments"] & { salesCount: number };
    };
    proof.payments.salesCount = 99;

    expect(() => validateProof(proof)).toThrow(/payments|unrecognized/i);
  });

  it("rejects fake transaction hashes", () => {
    const proof = cloneProof();
    proof.payments.transactionHashes = [`0x${"c".repeat(64)}`];

    expect(() => validateProof(proof)).toThrow(/transaction/i);
  });

  it("rejects claims without source paths", () => {
    const proof = cloneProof();
    proof.claims[0].sourcePaths = [];

    expect(() => validateProof(proof)).toThrow(/sourcePaths/i);
  });

  it("rejects a stale document hash", () => {
    const proof = cloneProof();
    proof.documentHash = "d".repeat(64);

    expect(() => validateProof(proof)).toThrow(/document hash/i);
  });
});
