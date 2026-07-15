import { ZodError } from "zod";

import { auditProduct } from "../../../../src/domain/audit";
import { auditRequestSchema } from "../../../../src/domain/schemas";
import {
  getBodyByteLength,
  internalErrorResponse,
  invalidJsonResponse,
  invalidRequestResponse,
  jsonResponse,
  MAX_AUDIT_BODY_BYTES,
  optionsResponse,
  payloadTooLargeResponse,
  unsupportedScopeResponse
} from "../../../../src/http/errors";

const AUDIT_METHODS = "OPTIONS, POST";

function isUnsupportedScope(report: { findings: Array<{ ruleId: string }> }): boolean {
  return report.findings.some((finding) => finding.ruleId === "PS-008");
}

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();

    if (getBodyByteLength(rawBody) > MAX_AUDIT_BODY_BYTES) {
      return payloadTooLargeResponse(AUDIT_METHODS);
    }

    let parsedBody: unknown;

    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return invalidJsonResponse(AUDIT_METHODS);
    }

    const auditRequest = auditRequestSchema.parse(parsedBody);
    const report = auditProduct(auditRequest);

    if (isUnsupportedScope(report)) {
      return unsupportedScopeResponse(report, AUDIT_METHODS);
    }

    return jsonResponse(report, 200, AUDIT_METHODS);
  } catch (error) {
    if (error instanceof ZodError) {
      return invalidRequestResponse(error, AUDIT_METHODS);
    }

    return internalErrorResponse(AUDIT_METHODS, error);
  }
}

export function OPTIONS(): Response {
  return optionsResponse(AUDIT_METHODS);
}
