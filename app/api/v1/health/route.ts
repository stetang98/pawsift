import {
  SERVICE_METADATA,
  jsonResponse,
  optionsResponse,
  unsupportedMethodHandler
} from "../../../../src/http/errors";

const HEALTH_METHODS = "GET, OPTIONS";

export function GET(): Response {
  return jsonResponse(
    {
      ...SERVICE_METADATA,
      status: "ok"
    },
    200,
    HEALTH_METHODS
  );
}

export function OPTIONS(): Response {
  return optionsResponse(HEALTH_METHODS);
}

export const POST = unsupportedMethodHandler(HEALTH_METHODS);
export const PUT = unsupportedMethodHandler(HEALTH_METHODS);
export const PATCH = unsupportedMethodHandler(HEALTH_METHODS);
export const DELETE = unsupportedMethodHandler(HEALTH_METHODS);
