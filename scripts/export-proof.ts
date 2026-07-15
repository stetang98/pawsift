import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  buildProofFromRepository,
  readProofExportConfig
} from "../src/proof/exporter";
import { serializeProof } from "../src/proof/proof";

const projectRoot = resolve(process.cwd());

async function main(): Promise<void> {
  const configPath = resolve(projectRoot, process.argv[2] ?? "proof/config.json");
  const config = readProofExportConfig(configPath);
  const proof = buildProofFromRepository(projectRoot, config);
  const outputDirectory = resolve(projectRoot, "proof");
  const outputPath = resolve(outputDirectory, "proof.json");

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, serializeProof(proof), "utf8");

  console.log(
    `Wrote ${outputPath} from ${configPath} (${proof.deployment.status}, ${proof.fixtures.length} verified fixtures)`
  );
}

void main();
