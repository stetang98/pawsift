import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildProofFromRepository,
  readProofExportConfig
} from "../../src/proof/exporter";
import { serializeProof } from "../../src/proof/proof";

describe("checked-in proof", () => {
  it("matches a default no-environment export from the pinned config", () => {
    const repository = resolve(process.cwd());
    const config = readProofExportConfig(resolve(repository, "proof/config.json"));
    const generated = buildProofFromRepository(repository, config);
    const checkedIn = readFileSync(resolve(repository, "proof/proof.json"), "utf8");

    expect(serializeProof(generated)).toBe(checkedIn);
  });
});
