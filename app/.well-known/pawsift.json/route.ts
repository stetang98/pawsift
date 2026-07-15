import {
  EXAMPLES_ENDPOINT,
  HEALTH_ENDPOINT,
  OPENAPI_ENDPOINT,
  SERVICE_METADATA,
  jsonResponse,
  optionsResponse,
  unsupportedMethodHandler
} from "../../../src/http/errors";

const WELL_KNOWN_METHODS = "GET, OPTIONS";

export function GET(): Response {
  return jsonResponse(
    {
      ...SERVICE_METADATA,
      health: HEALTH_ENDPOINT,
      examples: EXAMPLES_ENDPOINT,
      openapi: OPENAPI_ENDPOINT
    },
    200,
    WELL_KNOWN_METHODS
  );
}

export function OPTIONS(): Response {
  return optionsResponse(WELL_KNOWN_METHODS);
}

export const POST = unsupportedMethodHandler(WELL_KNOWN_METHODS);
export const PUT = unsupportedMethodHandler(WELL_KNOWN_METHODS);
export const PATCH = unsupportedMethodHandler(WELL_KNOWN_METHODS);
export const DELETE = unsupportedMethodHandler(WELL_KNOWN_METHODS);
