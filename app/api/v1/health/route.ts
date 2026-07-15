import { SERVICE_METADATA, jsonResponse, optionsResponse } from "../../../../src/http/errors";

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
