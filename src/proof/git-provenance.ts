import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const FULL_COMMIT_PATTERN = /^[0-9a-f]{40}$/;

export type GitSourceEvidence = {
  path: string;
  gitBlob: string;
  sha256: string;
};

function gitText(repository: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repository,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function gitBytes(repository: string, args: string[]): Buffer {
  return execFileSync("git", args, {
    cwd: repository,
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function digest(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

function assertRepositoryPath(path: string): void {
  if (
    path.length === 0 ||
    isAbsolute(path) ||
    path.includes("\\") ||
    path.split("/").includes("..")
  ) {
    throw new Error(`Invalid proof source path: ${path}`);
  }
}

export function collectGitSourceEvidence(
  repository: string,
  auditedCommit: string,
  sourcePaths: readonly string[]
): GitSourceEvidence[] {
  if (!FULL_COMMIT_PATTERN.test(auditedCommit)) {
    throw new Error("auditedCommit must be a full lowercase Git commit");
  }

  try {
    gitText(repository, ["cat-file", "-e", `${auditedCommit}^{commit}`]);
  } catch {
    throw new Error(`Audited commit does not exist: ${auditedCommit}`);
  }

  return sourcePaths.map((path) => {
    assertRepositoryPath(path);

    let committedContent: Buffer;
    let gitBlob: string;
    try {
      committedContent = gitBytes(repository, ["show", `${auditedCommit}:${path}`]);
      gitBlob = gitText(repository, ["rev-parse", `${auditedCommit}:${path}`]);
    } catch {
      throw new Error(`Proof source is missing from audited commit: ${path}`);
    }

    let workingContent: Buffer;
    try {
      workingContent = readFileSync(resolve(repository, path));
    } catch {
      throw new Error(`Proof source is missing from the working tree: ${path}`);
    }

    const committedDigest = digest(committedContent);
    if (digest(workingContent) !== committedDigest) {
      throw new Error(`Proof source does not match audited commit: ${path}`);
    }

    return {
      path,
      gitBlob,
      sha256: committedDigest
    };
  });
}
