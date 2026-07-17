import { toJSONSchema, z } from "zod";

import { auditProduct } from "../domain/audit";
import {
  AUDIT_FIXTURES,
  clearCatCollarFixture,
  missingMaterialsFixture,
  unsupportedClaimFixture
} from "../domain/fixtures";
import { auditRequestSchema, auditResponseSchema } from "../domain/schemas";
import {
  AUDIT_ENDPOINT,
  EXAMPLES_ENDPOINT,
  HEALTH_ENDPOINT,
  MAX_AUDIT_BODY_BYTES,
  OPENAPI_ENDPOINT,
  SERVICE_METADATA,
  WELL_KNOWN_ENDPOINT
} from "./errors";

const clearAuditExample = auditProduct(clearCatCollarFixture);
const cautionAuditExample = auditProduct(missingMaterialsFixture);
const humanReviewGuidanceExample = auditProduct(unsupportedClaimFixture);

const serviceMetadataSchema = z
  .object({
    name: z.literal(SERVICE_METADATA.name),
    version: z.literal(SERVICE_METADATA.version),
    endpoint: z.literal(AUDIT_ENDPOINT),
    category: z.literal(SERVICE_METADATA.category),
    type: z.literal(SERVICE_METADATA.type),
    boundary: z.literal(SERVICE_METADATA.boundary),
    rulesetVersion: z.literal(SERVICE_METADATA.rulesetVersion)
  })
  .strict();

const healthResponseSchema = serviceMetadataSchema
  .extend({
    status: z.literal("ok")
  })
  .strict();

const exampleEntrySchema = z
  .object({
    id: z.string(),
    label: z.string(),
    summary: z.string(),
    request: auditRequestSchema,
    expectedVerdict: z.enum(["CLEAR", "CAUTION", "BLOCK", "HUMAN_REVIEW"]),
    expectedRuleIds: z.array(z.string()),
    response: auditResponseSchema
  })
  .strict();

const examplesResponseSchema = serviceMetadataSchema
  .extend({
    examples: z.array(exampleEntrySchema)
  })
  .strict();

const wellKnownResponseSchema = serviceMetadataSchema
  .extend({
    health: z.literal(HEALTH_ENDPOINT),
    examples: z.literal(EXAMPLES_ENDPOINT),
    openapi: z.literal(OPENAPI_ENDPOINT)
  })
  .strict();

const invalidJsonResponseSchema = z
  .object({
    error: z
      .object({
        code: z.literal("INVALID_JSON"),
        message: z.literal("Request body must be valid JSON.")
      })
      .strict()
  })
  .strict();

const invalidRequestResponseSchema = z
  .object({
    error: z
      .object({
        code: z.literal("INVALID_REQUEST"),
        message: z.literal("Request body does not match the PawSift audit schema."),
        issues: z.array(
          z
            .object({
              path: z.string(),
              message: z.string()
            })
            .strict()
        )
      })
      .strict()
  })
  .strict();

const badRequestResponseSchema = z.union([invalidJsonResponseSchema, invalidRequestResponseSchema]);

const payloadTooLargeResponseSchema = z
  .object({
    error: z
      .object({
        code: z.literal("PAYLOAD_TOO_LARGE"),
        message: z.literal(`Request body must be ${MAX_AUDIT_BODY_BYTES} bytes or smaller.`)
      })
      .strict()
  })
  .strict();

const methodNotAllowedResponseSchema = z
  .object({
    error: z
      .object({
        code: z.literal("METHOD_NOT_ALLOWED"),
        message: z.literal("Method not allowed.")
      })
      .strict()
  })
  .strict();

const unsupportedScopeResponseSchema = z
  .object({
    error: z
      .object({
        code: z.literal("UNSUPPORTED_SCOPE"),
        message: z.literal("Request falls outside PawSift's supported non-veterinary scope.")
      })
      .strict(),
    guidance: auditResponseSchema
  })
  .strict();

const internalErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.literal("INTERNAL_ERROR"),
        message: z.literal("Internal server error."),
        correlationId: z.string()
      })
      .strict()
  })
  .strict();

const openApiDocumentResponseSchema = z
  .object({
    openapi: z.literal("3.1.0"),
    info: z
      .object({
        title: z.literal("PawSift A2MCP API"),
        version: z.literal(SERVICE_METADATA.version)
      })
      .strict(),
    servers: z.array(
      z
        .object({
          url: z.literal("/")
        })
        .strict()
    ),
    tags: z.array(
      z
        .object({
          name: z.string(),
          description: z.string()
        })
        .strict()
    ),
    paths: z.record(z.string(), z.unknown()),
    components: z
      .object({
        headers: z.record(z.string(), z.unknown()),
        schemas: z.record(z.string(), z.unknown())
      })
      .strict(),
    "x-pawsift": z
      .object({
        category: z.literal(SERVICE_METADATA.category),
        type: z.literal(SERVICE_METADATA.type),
        boundary: z.literal(SERVICE_METADATA.boundary),
        maxBodyBytes: z.literal(MAX_AUDIT_BODY_BYTES)
      })
      .strict()
  })
  .strict();

type OpenApiSchema = {
  description?: unknown;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  [key: string]: unknown;
};

function schemaRef(name: string): { $ref: string } {
  return {
    $ref: `#/components/schemas/${name}`
  };
}

function headerRef(name: string): { $ref: string } {
  return {
    $ref: `#/components/headers/${name}`
  };
}

function appendSentence(current: unknown, sentence: string): string {
  const trimmedCurrent = typeof current === "string" ? current.trim() : "";
  return trimmedCurrent ? `${trimmedCurrent} ${sentence}` : sentence;
}

function createOpenApiSchema(schema: z.ZodTypeAny, io: "input" | "output" = "output"): OpenApiSchema {
  return structuredClone(toJSONSchema(schema, { io })) as OpenApiSchema;
}

function addTrimMetadata(schema: OpenApiSchema): void {
  schema.description = appendSentence(
    schema.description,
    "Leading and trailing whitespace is trimmed before validation."
  );
  schema["x-pawsift-normalization"] = "trim";
}

function addDefaultArrayMetadata(schema: OpenApiSchema): void {
  schema.description = appendSentence(schema.description, "Defaults to [] when omitted.");
}

function requireSchema(schema: OpenApiSchema | undefined, path: string): OpenApiSchema {
  if (!schema) {
    throw new Error(`Missing generated OpenAPI schema node at ${path}.`);
  }

  return schema;
}

function createAuditRequestSchema(): OpenApiSchema {
  const schema = createOpenApiSchema(auditRequestSchema, "input");
  const pet = schema.properties?.pet;
  const product = schema.properties?.product;

  if (!pet?.properties || !product?.properties) {
    throw new Error("Audit request schema shape does not match the generated OpenAPI contract.");
  }

  addTrimMetadata(pet.properties.lifeStage);
  addDefaultArrayMetadata(pet.properties.traits);
  addTrimMetadata(requireSchema(pet.properties.traits.items, "pet.traits.items"));

  addTrimMetadata(product.properties.name);
  addDefaultArrayMetadata(product.properties.materials);
  addTrimMetadata(requireSchema(product.properties.materials.items, "product.materials.items"));
  addTrimMetadata(product.properties.supervisionStatement);
  addTrimMetadata(product.properties.careInstructions);
  addDefaultArrayMetadata(product.properties.claims);
  addTrimMetadata(requireSchema(product.properties.claims.items, "product.claims.items"));

  product.description = appendSentence(
    product.description,
    "If both minWeightKg and maxWeightKg are provided, minWeightKg must be less than or equal to maxWeightKg."
  );
  product["x-pawsift-constraints"] = [
    {
      kind: "min_lte_max",
      minField: "minWeightKg",
      maxField: "maxWeightKg"
    }
  ];

  return schema;
}

function commonResponseHeaders(): Record<string, { $ref: string }> {
  return {
    "Cache-Control": headerRef("CacheControlNoStore"),
    "X-PawSift-Ruleset": headerRef("PawSiftRuleset"),
    "Access-Control-Allow-Origin": headerRef("AccessControlAllowOrigin"),
    "Access-Control-Allow-Methods": headerRef("AccessControlAllowMethods"),
    "Access-Control-Allow-Headers": headerRef("AccessControlAllowHeaders"),
    "Access-Control-Expose-Headers": headerRef("AccessControlExposeHeaders")
  };
}

function methodNotAllowedHeaders(): Record<string, { $ref: string }> {
  return {
    ...commonResponseHeaders(),
    Allow: headerRef("Allow")
  };
}

function jsonResponseSpec(
  description: string,
  schemaName: string,
  examples?: Record<string, unknown>
): Record<string, unknown> {
  return {
    description,
    headers: commonResponseHeaders(),
    content: {
      "application/json": {
        schema: schemaRef(schemaName),
        ...(examples ? { examples } : {})
      }
    }
  };
}

function methodNotAllowedResponseSpec(): Record<string, unknown> {
  return {
    description: "Unsupported method for this route.",
    headers: methodNotAllowedHeaders(),
    content: {
      "application/json": {
        schema: schemaRef("MethodNotAllowedResponse")
      }
    }
  };
}

function optionsResponseSpec(description: string): Record<string, unknown> {
  return {
    description,
    headers: commonResponseHeaders()
  };
}

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "PawSift A2MCP API",
    version: SERVICE_METADATA.version
  },
  servers: [
    {
      url: "/"
    }
  ],
  tags: [
    {
      name: "audit",
      description: "Public PawSift audit contract."
    }
  ],
  paths: {
    [AUDIT_ENDPOINT]: {
      post: {
        tags: ["audit"],
        summary: "Audit a non-ingestible pet supply listing.",
        operationId: "postAudit",
        requestBody: {
          required: false,
          description:
            "Provide an AuditRequest for a product audit. A zero-byte availability probe returns the deterministic clear example with HTTP 200 for OKX.AI free-service validation.",
          content: {
            "application/json": {
              schema: schemaRef("AuditRequest"),
              examples: {
                clear: {
                  summary: "Supported clear request",
                  value: clearCatCollarFixture
                }
              }
            }
          }
        },
        responses: {
          "200": jsonResponseSpec("Successful audit response.", "AuditResponse", {
            clear: {
              summary: "CLEAR verdict",
              value: clearAuditExample
            },
            caution: {
              summary: "CAUTION verdict",
              value: cautionAuditExample
            }
          }),
          "400": jsonResponseSpec(
            "Malformed JSON or schema validation error.",
            "BadRequestResponse"
          ),
          "405": methodNotAllowedResponseSpec(),
          "413": jsonResponseSpec("Request body exceeded the 32 KiB limit.", "PayloadTooLargeResponse"),
          "422": jsonResponseSpec(
            "Request is explicitly outside the supported non-veterinary scope.",
            "UnsupportedScopeResponse",
            {
              humanReview: {
                summary: "HUMAN_REVIEW guidance for unsupported medical or ingestible language",
                value: {
                  error: {
                    code: "UNSUPPORTED_SCOPE",
                    message: "Request falls outside PawSift's supported non-veterinary scope."
                  },
                  guidance: humanReviewGuidanceExample
                }
              }
            }
          ),
          "500": jsonResponseSpec("Sanitized internal error response.", "InternalErrorResponse")
        }
      },
      options: {
        summary: "CORS preflight for the audit endpoint.",
        responses: {
          "204": optionsResponseSpec("Preflight response.")
        }
      }
    },
    [HEALTH_ENDPOINT]: {
      get: {
        summary: "Get PawSift service health and identity metadata.",
        responses: {
          "200": jsonResponseSpec("Health metadata.", "HealthResponse"),
          "405": methodNotAllowedResponseSpec()
        }
      },
      options: {
        summary: "CORS preflight for the health endpoint.",
        responses: {
          "204": optionsResponseSpec("Preflight response.")
        }
      }
    },
    [EXAMPLES_ENDPOINT]: {
      get: {
        summary: "Get reviewer-ready examples derived from shared fixtures.",
        responses: {
          "200": jsonResponseSpec("Fixture-backed examples.", "ExamplesResponse"),
          "405": methodNotAllowedResponseSpec()
        }
      },
      options: {
        summary: "CORS preflight for the examples endpoint.",
        responses: {
          "204": optionsResponseSpec("Preflight response.")
        }
      }
    },
    [OPENAPI_ENDPOINT]: {
      get: {
        summary: "Get the OpenAPI document for the public contract.",
        responses: {
          "200": jsonResponseSpec("OpenAPI document.", "OpenApiDocument"),
          "405": methodNotAllowedResponseSpec()
        }
      },
      options: {
        summary: "CORS preflight for the OpenAPI endpoint.",
        responses: {
          "204": optionsResponseSpec("Preflight response.")
        }
      }
    },
    [WELL_KNOWN_ENDPOINT]: {
      get: {
        summary: "Get service discovery metadata.",
        responses: {
          "200": jsonResponseSpec("Service discovery metadata.", "WellKnownResponse"),
          "405": methodNotAllowedResponseSpec()
        }
      },
      options: {
        summary: "CORS preflight for the well-known endpoint.",
        responses: {
          "204": optionsResponseSpec("Preflight response.")
        }
      }
    }
  },
  components: {
    headers: {
      Allow: {
        description: "Allowed methods for this route.",
        schema: {
          type: "string"
        }
      },
      CacheControlNoStore: {
        description: "Responses must not be cached.",
        schema: {
          type: "string",
          const: "no-store"
        }
      },
      PawSiftRuleset: {
        description: "Current PawSift ruleset version applied to the response.",
        schema: {
          type: "string",
          const: SERVICE_METADATA.rulesetVersion
        }
      },
      AccessControlAllowOrigin: {
        description: "Permissive read-only origin policy for public clients.",
        schema: {
          type: "string",
          const: "*"
        }
      },
      AccessControlAllowMethods: {
        description: "Allowed methods for this route.",
        schema: {
          type: "string"
        }
      },
      AccessControlAllowHeaders: {
        description: "Allowed request headers for this route.",
        schema: {
          type: "string",
          const: "content-type"
        }
      },
      AccessControlExposeHeaders: {
        description: "Response headers exposed to browsers.",
        schema: {
          type: "string",
          const: "x-pawsift-ruleset"
        }
      }
    },
    schemas: {
      AuditRequest: createAuditRequestSchema(),
      AuditResponse: createOpenApiSchema(auditResponseSchema),
      HealthResponse: createOpenApiSchema(healthResponseSchema),
      ExamplesResponse: createOpenApiSchema(examplesResponseSchema),
      WellKnownResponse: createOpenApiSchema(wellKnownResponseSchema),
      OpenApiDocument: createOpenApiSchema(openApiDocumentResponseSchema),
      BadRequestResponse: createOpenApiSchema(badRequestResponseSchema),
      PayloadTooLargeResponse: createOpenApiSchema(payloadTooLargeResponseSchema),
      MethodNotAllowedResponse: createOpenApiSchema(methodNotAllowedResponseSchema),
      UnsupportedScopeResponse: createOpenApiSchema(unsupportedScopeResponseSchema),
      InternalErrorResponse: createOpenApiSchema(internalErrorResponseSchema)
    }
  },
  "x-pawsift": {
    category: SERVICE_METADATA.category,
    type: SERVICE_METADATA.type,
    boundary: SERVICE_METADATA.boundary,
    maxBodyBytes: MAX_AUDIT_BODY_BYTES
  }
} as const;

export const openApiExamples = Object.freeze({
  clearAuditExample,
  cautionAuditExample,
  humanReviewGuidanceExample,
  fixtures: AUDIT_FIXTURES
});
