import {
  EXAMPLES_ENDPOINT,
  HEALTH_ENDPOINT,
  OPENAPI_ENDPOINT,
  SERVICE_METADATA,
  jsonResponse,
  optionsResponse
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
