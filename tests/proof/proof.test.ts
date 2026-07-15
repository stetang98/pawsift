import { describe, expect, it } from "vitest";

import { buildProof, serializeProof, validateProof } from "../../src/proof/proof";

const context = {
  auditedCommit: "a".repeat(40),
  generatedAt: "2026-07-15T18:00:00Z"
};

function cloneProof() {
  return structuredClone(buildProof(context));
}

describe("PawSift proof", () => {
  it("builds a proof that validates against the audited fixtures", () => {
    const proof = buildProof(context);

    expect(validateProof(proof)).toEqual(proof);
    expect(proof.fixtures).toHaveLength(10);
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

  it("rejects a non-HTTPS live endpoint", () => {
    const proof = cloneProof();
    proof.deployment = {
      status: "live",
      endpoint: "http://example.com",
      paymentMode: "free_launch"
    };

    expect(() => validateProof(proof)).toThrow(/HTTPS/i);
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
