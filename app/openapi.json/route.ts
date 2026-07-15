import { jsonResponse, optionsResponse, unsupportedMethodHandler } from "../../src/http/errors";
import { openApiDocument } from "../../src/http/openapi";

const OPENAPI_METHODS = "GET, OPTIONS";

export function GET(): Response {
  return jsonResponse(openApiDocument, 200, OPENAPI_METHODS);
}

export function OPTIONS(): Response {
  return optionsResponse(OPENAPI_METHODS);
}

export const POST = unsupportedMethodHandler(OPENAPI_METHODS);
export const PUT = unsupportedMethodHandler(OPENAPI_METHODS);
export const PATCH = unsupportedMethodHandler(OPENAPI_METHODS);
export const DELETE = unsupportedMethodHandler(OPENAPI_METHODS);
