import { auditProduct } from "../../src/domain/audit";
import {
  clearCatCollarFixture,
  missingMaterialsFixture,
  unsupportedClaimFixture
} from "../../src/domain/fixtures";
import {
  AUDIT_ENDPOINT,
  EXAMPLES_ENDPOINT,
  HEALTH_ENDPOINT,
  MAX_AUDIT_BODY_BYTES,
  OPENAPI_ENDPOINT,
  SERVICE_METADATA,
  WELL_KNOWN_ENDPOINT,
  jsonResponse,
  optionsResponse
} from "../../src/http/errors";

const OPENAPI_METHODS = "GET, OPTIONS";

const clearAuditExample = auditProduct(clearCatCollarFixture);
const cautionAuditExample = auditProduct(missingMaterialsFixture);
const humanReviewGuidanceExample = auditProduct(unsupportedClaimFixture);

const openApiDocument = {
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
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuditRequest"
              },
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
          "200": {
            description: "Successful audit response.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuditResponse"
                },
                examples: {
                  clear: {
                    summary: "CLEAR verdict",
                    value: clearAuditExample
                  },
                  caution: {
                    summary: "CAUTION verdict",
                    value: cautionAuditExample
                  }
                }
              }
            }
          },
          "400": {
            description: "Malformed JSON or schema validation error.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "413": {
            description: "Request body exceeded the 32 KiB limit.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "422": {
            description: "Request is explicitly outside the supported non-veterinary scope.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UnsupportedScopeResponse"
                },
                examples: {
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
              }
            }
          },
          "500": {
            description: "Sanitized internal error response.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/InternalErrorResponse"
                }
              }
            }
          }
        }
      },
      options: {
        summary: "CORS preflight for the audit endpoint.",
        responses: {
          "204": {
            description: "Preflight response."
          }
        }
      }
    },
    [HEALTH_ENDPOINT]: {
      get: {
        summary: "Get PawSift service health and identity metadata.",
        responses: {
          "200": {
            description: "Health metadata."
          }
        }
      }
    },
    [EXAMPLES_ENDPOINT]: {
      get: {
        summary: "Get reviewer-ready examples derived from shared fixtures.",
        responses: {
          "200": {
            description: "Fixture-backed examples."
          }
        }
      }
    },
    [OPENAPI_ENDPOINT]: {
      get: {
        summary: "Get the OpenAPI document for the public contract.",
        responses: {
          "200": {
            description: "OpenAPI document."
          }
        }
      }
    },
    [WELL_KNOWN_ENDPOINT]: {
      get: {
        summary: "Get service discovery metadata.",
        responses: {
          "200": {
            description: "Service discovery metadata."
          }
        }
      }
    }
  },
  components: {
    schemas: {
      AuditRequest: {
        type: "object",
        additionalProperties: false,
        required: ["pet", "product"],
        properties: {
          pet: {
            type: "object",
            additionalProperties: false,
            required: ["species", "lifeStage", "weightKg"],
            properties: {
              species: {
                type: "string",
                enum: ["cat", "dog"]
              },
              lifeStage: {
                type: "string",
                minLength: 1,
                maxLength: 500
              },
              weightKg: {
                type: "number",
                minimum: 0
              },
              traits: {
                type: "array",
                maxItems: 500,
                items: {
                  type: "string",
                  minLength: 1,
                  maxLength: 500
                }
              }
            }
          },
          product: {
            type: "object",
            additionalProperties: false,
            required: ["name", "category", "intendedSpecies"],
            properties: {
              name: {
                type: "string",
                minLength: 1,
                maxLength: 500
              },
              category: {
                type: "string",
                enum: [
                  "toy",
                  "carrier",
                  "bed",
                  "feeder",
                  "collar_harness",
                  "grooming_tool"
                ]
              },
              intendedSpecies: {
                type: "array",
                minItems: 1,
                maxItems: 2,
                items: {
                  type: "string",
                  enum: ["cat", "dog"]
                }
              },
              materials: {
                type: "array",
                maxItems: 500,
                items: {
                  type: "string",
                  minLength: 1,
                  maxLength: 500
                }
              },
              minWeightKg: {
                type: "number",
                minimum: 0
              },
              maxWeightKg: {
                type: "number",
                minimum: 0
              },
              dimensionsCm: {
                type: "object",
                additionalProperties: false,
                properties: {
                  lengthCm: {
                    type: "number",
                    minimum: 0
                  },
                  widthCm: {
                    type: "number",
                    minimum: 0
                  },
                  heightCm: {
                    type: "number",
                    minimum: 0
                  }
                }
              },
              breakaway: {
                type: "boolean"
              },
              hasDetachableParts: {
                type: "boolean"
              },
              supervisionStatement: {
                type: "string",
                minLength: 1,
                maxLength: 500
              },
              containsBattery: {
                type: "boolean"
              },
              containsMagnet: {
                type: "boolean"
              },
              careInstructions: {
                type: "string",
                minLength: 1,
                maxLength: 500
              },
              claims: {
                type: "array",
                maxItems: 500,
                items: {
                  type: "string",
                  minLength: 1,
                  maxLength: 500
                }
              }
            }
          }
        }
      },
      AuditResponse: {
        type: "object",
        additionalProperties: false,
        required: [
          "verdict",
          "score",
          "rulesetVersion",
          "findings",
          "missingFacts",
          "ownerQuestions",
          "listingPatch",
          "boundary",
          "receipt"
        ],
        properties: {
          verdict: {
            type: "string",
            enum: ["CLEAR", "CAUTION", "BLOCK", "HUMAN_REVIEW"]
          },
          score: {
            type: "integer",
            minimum: 0,
            maximum: 100
          },
          rulesetVersion: {
            type: "string"
          },
          findings: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["ruleId", "severity", "title", "reason", "evidence", "remediation"],
              properties: {
                ruleId: {
                  type: "string"
                },
                severity: {
                  type: "string",
                  enum: ["CLEAR", "CAUTION", "BLOCK", "HUMAN_REVIEW"]
                },
                title: {
                  type: "string"
                },
                reason: {
                  type: "string"
                },
                evidence: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                },
                remediation: {
                  type: "string"
                }
              }
            }
          },
          missingFacts: {
            type: "array",
            items: {
              type: "string"
            }
          },
          ownerQuestions: {
            type: "array",
            items: {
              type: "string"
            }
          },
          listingPatch: {
            type: "array",
            items: {
              type: "string"
            }
          },
          boundary: {
            type: "string"
          },
          receipt: {
            type: "object",
            additionalProperties: false,
            required: ["algorithm", "inputHash", "reportHash"],
            properties: {
              algorithm: {
                type: "string",
                enum: ["sha256"]
              },
              inputHash: {
                type: "string",
                pattern: "^[0-9a-f]{64}$"
              },
              reportHash: {
                type: "string",
                pattern: "^[0-9a-f]{64}$"
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: "object",
        additionalProperties: false,
        required: ["error"],
        properties: {
          error: {
            type: "object",
            additionalProperties: false,
            required: ["code", "message"],
            properties: {
              code: {
                type: "string",
                enum: ["INVALID_JSON", "INVALID_REQUEST", "PAYLOAD_TOO_LARGE"]
              },
              message: {
                type: "string"
              },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["path", "message"],
                  properties: {
                    path: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        }
      },
      UnsupportedScopeResponse: {
        type: "object",
        additionalProperties: false,
        required: ["error", "guidance"],
        properties: {
          error: {
            type: "object",
            additionalProperties: false,
            required: ["code", "message"],
            properties: {
              code: {
                type: "string",
                enum: ["UNSUPPORTED_SCOPE"]
              },
              message: {
                type: "string"
              }
            }
          },
          guidance: {
            $ref: "#/components/schemas/AuditResponse"
          }
        }
      },
      InternalErrorResponse: {
        type: "object",
        additionalProperties: false,
        required: ["error"],
        properties: {
          error: {
            type: "object",
            additionalProperties: false,
            required: ["code", "message", "correlationId"],
            properties: {
              code: {
                type: "string",
                enum: ["INTERNAL_ERROR"]
              },
              message: {
                type: "string"
              },
              correlationId: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  "x-pawsift": {
    category: SERVICE_METADATA.category,
    type: SERVICE_METADATA.type,
    boundary: SERVICE_METADATA.boundary,
    maxBodyBytes: MAX_AUDIT_BODY_BYTES
  }
} as const;

export function GET(): Response {
  return jsonResponse(openApiDocument, 200, OPENAPI_METHODS);
}

export function OPTIONS(): Response {
  return optionsResponse(OPENAPI_METHODS);
}
