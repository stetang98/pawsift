import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

import packageJson from "../../package.json";
import { type AuditResponse } from "../domain/schemas";
import { BOUNDARY_TEXT, RULESET_VERSION } from "../domain/rules";

export const MAX_AUDIT_BODY_BYTES = 32 * 1024;
export const AUDIT_ENDPOINT = "/api/v1/audit";
export const HEALTH_ENDPOINT = "/api/v1/health";
export const EXAMPLES_ENDPOINT = "/api/v1/examples";
export const OPENAPI_ENDPOINT = "/openapi.json";
export const WELL_KNOWN_ENDPOINT = "/.well-known/pawsift.json";

export const SERVICE_METADATA = Object.freeze({
  name: "PawSift",
  version: packageJson.version,
  endpoint: AUDIT_ENDPOINT,
  category: "Lifestyle",
  type: "A2MCP",
  boundary: BOUNDARY_TEXT,
  rulesetVersion: RULESET_VERSION
});

type JsonStatus = 200 | 400 | 413 | 422 | 500;

type InvalidJsonError = {
  error: {
    code: "INVALID_JSON";
    message: string;
  };
};

type InvalidRequestError = {
  error: {
    code: "INVALID_REQUEST";
    message: string;
    issues: Array<{
      path: string;
      message: string;
    }>;
  };
};

type PayloadTooLargeError = {
  error: {
    code: "PAYLOAD_TOO_LARGE";
    message: string;
  };
};

type UnsupportedScopeError = {
  error: {
    code: "UNSUPPORTED_SCOPE";
    message: string;
  };
  guidance: AuditResponse;
};

type InternalError = {
  error: {
    code: "INTERNAL_ERROR";
    message: string;
    correlationId: string;
  };
};

export type ErrorResponseBody =
  | InvalidJsonError
  | InvalidRequestError
  | PayloadTooLargeError
  | UnsupportedScopeError
  | InternalError;

function buildCorsHeaders(methods: string): Headers {
  const headers = new Headers();
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", methods);
  headers.set("access-control-allow-headers", "content-type");
  headers.set("access-control-expose-headers", "x-pawsift-ruleset");
  headers.set("cache-control", "no-store");
  headers.set("x-pawsift-ruleset", RULESET_VERSION);
  return headers;
}

function issuePath(path: PropertyKey[]): string {
  return path.map(String).join(".");
}

function normalizeIssues(error: ZodError): InvalidRequestError["error"]["issues"] {
  return error.issues.flatMap((issue) => {
    if (
      issue.code === "unrecognized_keys" &&
      "keys" in issue &&
      Array.isArray(issue.keys) &&
      issue.keys.length > 0
    ) {
      const basePath = issuePath(issue.path);

      return issue.keys.map((key) => ({
        path: basePath ? `${basePath}.${key}` : key,
        message: `Unrecognized key: "${key}"`
      }));
    }

    return [
      {
        path: issuePath(issue.path) || "(root)",
        message: issue.message
      }
    ];
  });
}

export function getBodyByteLength(body: string): number {
  return new TextEncoder().encode(body).byteLength;
}

export function jsonResponse(body: unknown, status: JsonStatus, methods: string): Response {
  return Response.json(body, {
    status,
    headers: buildCorsHeaders(methods)
  });
}

export function optionsResponse(methods: string): Response {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(methods)
  });
}

export function invalidJsonResponse(methods: string): Response {
  return jsonResponse(
    {
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON."
      }
    } satisfies InvalidJsonError,
    400,
    methods
  );
}

export function invalidRequestResponse(error: ZodError, methods: string): Response {
  return jsonResponse(
    {
      error: {
        code: "INVALID_REQUEST",
        message: "Request body does not match the PawSift audit schema.",
        issues: normalizeIssues(error)
      }
    } satisfies InvalidRequestError,
    400,
    methods
  );
}

export function payloadTooLargeResponse(methods: string): Response {
  return jsonResponse(
    {
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: `Request body must be ${MAX_AUDIT_BODY_BYTES} bytes or smaller.`
      }
    } satisfies PayloadTooLargeError,
    413,
    methods
  );
}

export function unsupportedScopeResponse(guidance: AuditResponse, methods: string): Response {
  return jsonResponse(
    {
      error: {
        code: "UNSUPPORTED_SCOPE",
        message: "Request falls outside PawSift's supported non-veterinary scope."
      },
      guidance
    } satisfies UnsupportedScopeError,
    422,
    methods
  );
}

export function internalErrorResponse(methods: string, error?: unknown): Response {
  const correlationId = randomUUID();

  if (error instanceof Error) {
    console.error(`[pawsift][${correlationId}]`, error.message);
  } else if (error !== undefined) {
    console.error(`[pawsift][${correlationId}]`, error);
  }

  return jsonResponse(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error.",
        correlationId
      }
    } satisfies InternalError,
    500,
    methods
  );
}
