import { canonicalize } from "./canonical-json";
import type { AuditRequest, AuditResponse } from "./schemas";

export type CanonicalReceiptEnvelope = {
  algorithm: AuditResponse["receipt"]["algorithm"];
  inputHash: string;
  reportHash: string;
  canonicalInput: string;
  canonicalReportWithoutReportHash: string;
};

export function buildReceiptEnvelope(
  request: AuditRequest,
  report: AuditResponse
): CanonicalReceiptEnvelope {
  const { reportHash, ...receiptWithoutReportHash } = report.receipt;

  return {
    algorithm: report.receipt.algorithm,
    inputHash: report.receipt.inputHash,
    reportHash,
    canonicalInput: canonicalize(request),
    canonicalReportWithoutReportHash: canonicalize({
      ...report,
      receipt: receiptWithoutReportHash
    })
  };
}
