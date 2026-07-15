import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildProof, serializeProof } from "../src/proof/proof";

const projectRoot = resolve(process.cwd());

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8"
  }).trim();
}

function normalizePublicUrl(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized.replace(/\/$/, "") : undefined;
}

async function main(): Promise<void> {
  const auditedCommit =
    process.env.PAWSIFT_PROOF_COMMIT?.trim() || git(["rev-parse", "HEAD"]);
  const generatedAt = git(["show", "-s", "--format=%cI", auditedCommit]);
  const publicUrl = normalizePublicUrl(process.env.PAWSIFT_PUBLIC_URL);
  const proof = buildProof({ auditedCommit, generatedAt, publicUrl });
  const outputDirectory = resolve(projectRoot, "proof");
  const outputPath = resolve(outputDirectory, "proof.json");

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, serializeProof(proof), "utf8");

  console.log(
    `Wrote ${outputPath} (${proof.deployment.status}, ${proof.fixtures.length} verified fixtures)`
  );
}

void main();
