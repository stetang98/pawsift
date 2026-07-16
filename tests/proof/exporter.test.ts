import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildProofFromRepository,
  parseProofExportConfig
} from "../../src/proof/exporter";
import {
  EXPECTED_PUBLIC_ORIGIN,
  PROOF_SOURCE_PATHS,
  serializeProof
} from "../../src/proof/proof";

const repositories: string[] = [];

function git(repository: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repository,
    encoding: "utf8"
  }).trim();
}

function createProofRepository(): { repository: string; commit: string } {
  const repository = mkdtempSync(join(tmpdir(), "pawsift-export-"));
  repositories.push(repository);
  git(repository, ["init", "--quiet"]);
  git(repository, ["config", "user.email", "proof@example.com"]);
  git(repository, ["config", "user.name", "PawSift Proof Test"]);

  for (const path of PROOF_SOURCE_PATHS) {
    const absolutePath = join(repository, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, `audited ${path}\n`, "utf8");
  }

  git(repository, ["add", "."]);
  git(repository, ["commit", "--quiet", "-m", "audited sources"]);

  return {
    repository,
    commit: git(repository, ["rev-parse", "HEAD"])
  };
}

afterEach(() => {
  for (const repository of repositories) {
    rmSync(repository, { force: true, recursive: true });
  }
  repositories.length = 0;
});

describe("proof exporter", () => {
  it("rebuilds a pinned proof without consulting process environment", () => {
    const { repository, commit } = createProofRepository();
    const config = parseProofExportConfig({
      schemaVersion: "1.0.0",
      auditedCommit: commit,
      deployment: { status: "pending" }
    });
    const previousPublicUrl = process.env.PAWSIFT_PUBLIC_URL;
    process.env.PAWSIFT_PUBLIC_URL = "https://example.com";

    try {
      const first = buildProofFromRepository(repository, config);
      const second = buildProofFromRepository(repository, config);

      expect(serializeProof(second)).toBe(serializeProof(first));
      expect(second.source.auditedCommit).toBe(commit);
      expect(second.deployment).toEqual({ status: "pending", paymentMode: "free_launch" });
    } finally {
      if (previousPublicUrl === undefined) {
        delete process.env.PAWSIFT_PUBLIC_URL;
      } else {
        process.env.PAWSIFT_PUBLIC_URL = previousPublicUrl;
      }
    }
  });

  it("derives the live evidence digest from the pinned deployment record", () => {
    const { repository, commit } = createProofRepository();
    const config = parseProofExportConfig({
      schemaVersion: "1.0.0",
      auditedCommit: commit,
      deployment: {
        status: "live",
        endpoint: EXPECTED_PUBLIC_ORIGIN,
        verifiedAt: "2026-07-15T23:10:27Z",
        health: {
          url: `${EXPECTED_PUBLIC_ORIGIN}/api/v1/health`,
          status: "ok",
          rulesetVersion: "2026.07.2"
        },
        fixture: {
          id: "clear-cat-collar",
          inputHash: "f8ab57435e1fb63b7fda95d06437c263ef87e1c63051e723e39ee56797eff5ff",
          reportHash: "f5bd2cbcb24b55469243c036ef20a7bedb0bd085d4af5435dbecda6cf69a97e2"
        },
        evidencePath: "ops/DEPLOYMENT.md"
      }
    });

    const proof = buildProofFromRepository(repository, config);
    const evidence = proof.source.files.find((file) => file.path === "ops/DEPLOYMENT.md");

    expect(proof.deployment.status).toBe("live");
    if (proof.deployment.status === "live") {
      expect(proof.deployment.verification.evidenceSha256).toBe(evidence?.sha256);
    }
  });
});
