import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { collectGitSourceEvidence } from "../../src/proof/git-provenance";

const temporaryRepositories: string[] = [];

function git(repository: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repository,
    encoding: "utf8"
  }).trim();
}

function createRepository(): { repository: string; commit: string } {
  const repository = mkdtempSync(join(tmpdir(), "pawsift-proof-"));
  temporaryRepositories.push(repository);
  git(repository, ["init", "--quiet"]);
  git(repository, ["config", "user.email", "proof@example.com"]);
  git(repository, ["config", "user.name", "PawSift Proof Test"]);
  writeFileSync(join(repository, "source.txt"), "stable source\n", "utf8");
  git(repository, ["add", "source.txt"]);
  git(repository, ["commit", "--quiet", "-m", "fixture"]);

  return {
    repository,
    commit: git(repository, ["rev-parse", "HEAD"])
  };
}

afterEach(() => {
  for (const repository of temporaryRepositories) {
    rmSync(repository, { force: true, recursive: true });
  }
  temporaryRepositories.length = 0;
});

describe("collectGitSourceEvidence", () => {
  it("records the Git blob and content digest for a clean audited source", () => {
    const { repository, commit } = createRepository();

    const evidence = collectGitSourceEvidence(repository, commit, ["source.txt"]);

    expect(evidence).toEqual([
      {
        path: "source.txt",
        gitBlob: git(repository, ["rev-parse", `${commit}:source.txt`]),
        sha256: "32e59b64ed0865c665973bbf01c7541ad6ab4f2788512ddfacf3826432773548"
      }
    ]);
  });

  it("rejects a working source that differs from the audited commit", () => {
    const { repository, commit } = createRepository();
    writeFileSync(join(repository, "source.txt"), "modified source\n", "utf8");

    expect(() => collectGitSourceEvidence(repository, commit, ["source.txt"])).toThrow(
      /does not match audited commit/i
    );
  });

  it("rejects a source path that is absent from the audited commit", () => {
    const { repository, commit } = createRepository();

    expect(() => collectGitSourceEvidence(repository, commit, ["missing.txt"])).toThrow(
      /missing from audited commit/i
    );
  });
});
