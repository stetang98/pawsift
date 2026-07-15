import { auditProduct } from "../../../../src/domain/audit";
import { AUDIT_FIXTURES } from "../../../../src/domain/fixtures";
import { SERVICE_METADATA, jsonResponse, optionsResponse } from "../../../../src/http/errors";

const EXAMPLES_METHODS = "GET, OPTIONS";

export function GET(): Response {
  return jsonResponse(
    {
      ...SERVICE_METADATA,
      examples: AUDIT_FIXTURES.map((fixture) => ({
        id: fixture.id,
        label: fixture.label,
        summary: fixture.summary,
        request: fixture.request,
        expectedVerdict: fixture.expectedVerdict,
        expectedRuleIds: fixture.expectedRuleIds,
        response: auditProduct(fixture.request)
      }))
    },
    200,
    EXAMPLES_METHODS
  );
}

export function OPTIONS(): Response {
  return optionsResponse(EXAMPLES_METHODS);
}
