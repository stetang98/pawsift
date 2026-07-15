import { ZodError } from "zod";

import { auditProduct } from "../../../../src/domain/audit";
import { auditRequestSchema } from "../../../../src/domain/schemas";
import {
  internalErrorResponse,
  invalidJsonResponse,
  invalidRequestResponse,
  jsonResponse,
  MAX_AUDIT_BODY_BYTES,
  optionsResponse,
  payloadTooLargeResponse,
  readRawRequestBody,
  unsupportedMethodHandler,
  unsupportedScopeResponse
} from "../../../../src/http/errors";

const AUDIT_METHODS = "OPTIONS, POST";

function isUnsupportedScope(report: { findings: Array<{ ruleId: string }> }): boolean {
  return report.findings.some((finding) => finding.ruleId === "PS-008");
}

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await readRawRequestBody(request, MAX_AUDIT_BODY_BYTES);

    if (!rawBody.ok) {
      if (rawBody.reason === "payload_too_large") {
        return payloadTooLargeResponse(AUDIT_METHODS);
      }

      return invalidJsonResponse(AUDIT_METHODS);
    }

    if (rawBody.body.length > MAX_AUDIT_BODY_BYTES) {
      return payloadTooLargeResponse(AUDIT_METHODS);
    }

    let parsedBody: unknown;

    try {
      parsedBody = JSON.parse(rawBody.body);
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

export const GET = unsupportedMethodHandler(AUDIT_METHODS);
export const PUT = unsupportedMethodHandler(AUDIT_METHODS);
export const PATCH = unsupportedMethodHandler(AUDIT_METHODS);
export const DELETE = unsupportedMethodHandler(AUDIT_METHODS);
