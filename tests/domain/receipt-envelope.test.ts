import { describe, expect, it } from "vitest";

import { auditProduct } from "../../src/domain/audit";
import { sha256 } from "../../src/domain/canonical";
import { clearCatCollarFixture } from "../../src/domain/fixtures";
import { buildReceiptEnvelope } from "../../src/domain/receipt-envelope";

describe("buildReceiptEnvelope", () => {
  it("exports canonical preimages that independently reproduce both receipt hashes", () => {
    const report = auditProduct(clearCatCollarFixture);
    const envelope = buildReceiptEnvelope(clearCatCollarFixture, report);

    expect(sha256(envelope.canonicalInput)).toBe(envelope.inputHash);
    expect(sha256(envelope.canonicalReportWithoutReportHash)).toBe(envelope.reportHash);
    expect(JSON.parse(envelope.canonicalInput)).toEqual(clearCatCollarFixture);

    const reportPreimage = JSON.parse(envelope.canonicalReportWithoutReportHash) as {
      receipt: Record<string, unknown>;
    };

    expect(reportPreimage.receipt).toEqual({
      algorithm: "sha256",
      inputHash: report.receipt.inputHash
    });
    expect(reportPreimage.receipt).not.toHaveProperty("reportHash");
  });
});
