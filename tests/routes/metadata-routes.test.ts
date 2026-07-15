import Ajv from "ajv";
import { describe, expect, it } from "vitest";

import * as wellKnownRoute from "../../app/.well-known/pawsift.json/route";
import * as auditRoute from "../../app/api/v1/audit/route";
import * as examplesRoute from "../../app/api/v1/examples/route";
import * as healthRoute from "../../app/api/v1/health/route";
import * as openApiRoute from "../../app/openapi.json/route";
import { auditProduct } from "../../src/domain/audit";
import { AUDIT_FIXTURES, clearCatCollarFixture, missingMaterialsFixture, unsupportedClaimFixture } from "../../src/domain/fixtures";
import { auditRequestSchema } from "../../src/domain/schemas";
import { BOUNDARY_TEXT, RULESET_VERSION } from "../../src/domain/rules";
import packageJson from "../../package.json";

function expectMetadataHeaders(response: Response, methods: string): void {
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-pawsift-ruleset")).toBe(RULESET_VERSION);
  expect(response.headers.get("access-control-allow-origin")).toBe("*");
  expect(response.headers.get("access-control-allow-methods")).toBe(methods);
  expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
  expect(response.headers.get("access-control-expose-headers")).toBe("x-pawsift-ruleset");
}

async function expectMethodNotAllowedResponse(
  handler: () => Response | Promise<Response>,
  methods: string
): Promise<void> {
  const response = await handler();

  expect(response.status).toBe(405);
  expectMetadataHeaders(response, methods);
  expect(response.headers.get("allow")).toBe(methods);
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed."
    }
  });
}

type OpenApiDocumentLike = {
  components: Record<string, unknown>;
  paths: Record<
    string,
    {
      options?: {
        responses: Record<
          string,
          {
            headers?: Record<string, unknown>;
          }
        >;
      };
      get?: {
        responses: Record<
          string,
          {
            headers?: Record<string, unknown>;
          }
        >;
      };
      post?: {
        responses: Record<
          string,
          {
            headers?: Record<string, unknown>;
          }
        >;
      };
    }
  >;
};

type JsonSchemaLike = {
  $ref?: string;
  [key: string]: unknown;
};

function createSchemaValidator(document: OpenApiDocumentLike, schema: JsonSchemaLike) {
  const ajv = new Ajv({
    allErrors: true
  });

  return ajv.compile({
    $id: "https://pawsift.test/openapi.json",
    ...(schema.$ref ? { $ref: schema.$ref } : schema),
    components: document.components
  });
}

describe("GET /api/v1/health", () => {
  it("publishes the A2MCP service identity and ruleset metadata", async () => {
    const response = await healthRoute.GET();

    expect(response.status).toBe(200);
    expectMetadataHeaders(response, "GET, OPTIONS");
    await expect(response.json()).resolves.toEqual({
      name: "PawSift",
      version: packageJson.version,
      status: "ok",
      endpoint: "/api/v1/audit",
      category: "Lifestyle",
      type: "A2MCP",
      boundary: BOUNDARY_TEXT,
      rulesetVersion: RULESET_VERSION
    });
  });

  it("answers OPTIONS with the documented CORS headers", async () => {
    const response = await healthRoute.OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-pawsift-ruleset")).toBe(RULESET_VERSION);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toBe("GET, OPTIONS");
    expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
    expect(response.headers.get("access-control-expose-headers")).toBe("x-pawsift-ruleset");
  });
});

describe("GET /api/v1/examples", () => {
  it("derives reviewer examples from the shared checked-in fixtures", async () => {
    const response = await examplesRoute.GET();

    expect(response.status).toBe(200);
    expectMetadataHeaders(response, "GET, OPTIONS");

    await expect(response.json()).resolves.toEqual({
      name: "PawSift",
      version: packageJson.version,
      endpoint: "/api/v1/audit",
      category: "Lifestyle",
      type: "A2MCP",
      boundary: BOUNDARY_TEXT,
      rulesetVersion: RULESET_VERSION,
      examples: AUDIT_FIXTURES.map((fixture) => ({
        id: fixture.id,
        label: fixture.label,
        summary: fixture.summary,
        request: fixture.request,
        expectedVerdict: fixture.expectedVerdict,
        expectedRuleIds: fixture.expectedRuleIds,
        response: auditProduct(fixture.request)
      }))
    });
  });

  it("answers OPTIONS with the documented CORS headers", async () => {
    const response = await examplesRoute.OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-pawsift-ruleset")).toBe(RULESET_VERSION);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toBe("GET, OPTIONS");
    expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
    expect(response.headers.get("access-control-expose-headers")).toBe("x-pawsift-ruleset");
  });
});

describe("GET /openapi.json", () => {
  it("publishes a contract whose examples stay pinned to shared fixtures and derived reports", async () => {
    const response = await openApiRoute.GET();

    expect(response.status).toBe(200);
    expectMetadataHeaders(response, "GET, OPTIONS");

    const document = await response.json();
    expect(document.info).toEqual({
      title: "PawSift A2MCP API",
      version: packageJson.version
    });
    expect(document.paths["/api/v1/audit"].post.responses["200"].description).toBe(
      "Successful audit response."
    );
    expect(document.paths["/api/v1/audit"].post.responses["400"].description).toBe(
      "Malformed JSON or schema validation error."
    );
    expect(document.paths["/api/v1/audit"].post.responses["413"].description).toBe(
      "Request body exceeded the 32 KiB limit."
    );
    expect(document.paths["/api/v1/audit"].post.responses["422"].description).toBe(
      "Request is explicitly outside the supported non-veterinary scope."
    );
    expect(
      document.paths["/api/v1/audit"].post.requestBody.content["application/json"].examples.clear
        .value
    ).toEqual(clearCatCollarFixture);
    expect(
      document.paths["/api/v1/audit"].post.responses["200"].content["application/json"].examples
        .clear.value
    ).toEqual(auditProduct(clearCatCollarFixture));
    expect(
      document.paths["/api/v1/audit"].post.responses["200"].content["application/json"].examples
        .caution.value
    ).toEqual(auditProduct(missingMaterialsFixture));
    expect(
      document.paths["/api/v1/audit"].post.responses["422"].content["application/json"].examples
        .humanReview.value.guidance
    ).toEqual({
      ...auditProduct(unsupportedClaimFixture),
      boundary: BOUNDARY_TEXT
    });
  });

  it("documents normalization, defaults, options, 405s, and common headers in parity with the runtime contract", async () => {
    const response = await openApiRoute.GET();
    const document = await response.json();

    expect(document.components.schemas.AuditRequest.properties.pet.properties.lifeStage).toMatchObject({
      maxLength: 500,
      minLength: 1,
      "x-pawsift-normalization": "trim"
    });
    expect(document.components.schemas.AuditRequest.properties.product.properties.name).toMatchObject({
      "x-pawsift-normalization": "trim"
    });
    expect(document.components.schemas.AuditRequest.properties.pet.properties.traits.default).toEqual([]);
    expect(document.components.schemas.AuditRequest.properties.product.properties.materials.default).toEqual([]);
    expect(document.components.schemas.AuditRequest.properties.product.properties.claims.default).toEqual([]);
    expect(document.components.schemas.AuditRequest.properties.product["x-pawsift-constraints"]).toEqual([
      {
        kind: "min_lte_max",
        minField: "minWeightKg",
        maxField: "maxWeightKg"
      }
    ]);

    const normalized = auditRequestSchema.parse({
      pet: {
        species: "cat",
        lifeStage: " adult ",
        weightKg: 4,
        traits: [" indoor "]
      },
      product: {
        name: " breakaway collar ",
        category: "collar_harness",
        intendedSpecies: ["cat"],
        claims: [" reflective "]
      }
    });

    expect(normalized.pet.lifeStage).toBe("adult");
    expect(normalized.pet.traits).toEqual(["indoor"]);
    expect(normalized.product.name).toBe("breakaway collar");
    expect(normalized.product.claims).toEqual(["reflective"]);
    expect(
      auditRequestSchema.safeParse({
        pet: clearCatCollarFixture.pet,
        product: {
          ...clearCatCollarFixture.product,
          minWeightKg: 5,
          maxWeightKg: 4
        }
      }).success
    ).toBe(false);

    for (const config of Object.values((document as OpenApiDocumentLike).paths)) {
      if (config.options) {
        expect(config.options.responses["204"]).toBeDefined();
        expect(config.options.responses["204"].headers).toEqual(
          expect.objectContaining({
            "Cache-Control": { $ref: "#/components/headers/CacheControlNoStore" },
            "X-PawSift-Ruleset": { $ref: "#/components/headers/PawSiftRuleset" },
            "Access-Control-Allow-Origin": { $ref: "#/components/headers/AccessControlAllowOrigin" },
            "Access-Control-Allow-Methods": { $ref: "#/components/headers/AccessControlAllowMethods" },
            "Access-Control-Allow-Headers": { $ref: "#/components/headers/AccessControlAllowHeaders" },
            "Access-Control-Expose-Headers": {
              $ref: "#/components/headers/AccessControlExposeHeaders"
            }
          })
        );
      }

      for (const operationName of ["get", "post"] as const) {
        if (!config[operationName]) {
          continue;
        }

        expect(config[operationName].responses["405"]).toBeDefined();
        expect(config[operationName].responses["405"].headers).toEqual(
          expect.objectContaining({
            Allow: { $ref: "#/components/headers/Allow" },
            "Cache-Control": { $ref: "#/components/headers/CacheControlNoStore" },
            "X-PawSift-Ruleset": { $ref: "#/components/headers/PawSiftRuleset" }
          })
        );
      }
    }
  });

  it("publishes metadata response schemas that validate the live route payloads", async () => {
    const document = await (await openApiRoute.GET()).json();

    const healthBody = await (await healthRoute.GET()).json();
    const examplesBody = await (await examplesRoute.GET()).json();
    const wellKnownBody = await (await wellKnownRoute.GET()).json();

    const healthSchema =
      document.paths["/api/v1/health"].get.responses["200"].content["application/json"].schema;
    const examplesSchema =
      document.paths["/api/v1/examples"].get.responses["200"].content["application/json"].schema;
    const wellKnownSchema =
      document.paths["/.well-known/pawsift.json"].get.responses["200"].content["application/json"]
        .schema;

    expect(createSchemaValidator(document, healthSchema)(healthBody)).toBe(true);
    expect(createSchemaValidator(document, examplesSchema)(examplesBody)).toBe(true);
    expect(createSchemaValidator(document, wellKnownSchema)(wellKnownBody)).toBe(true);
  });

  it("answers OPTIONS with the documented CORS headers", async () => {
    const response = await openApiRoute.OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-pawsift-ruleset")).toBe(RULESET_VERSION);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toBe("GET, OPTIONS");
    expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
    expect(response.headers.get("access-control-expose-headers")).toBe("x-pawsift-ruleset");
  });
});

describe("GET /.well-known/pawsift.json", () => {
  it("publishes service metadata, discovery links, and the non-veterinary boundary", async () => {
    const response = await wellKnownRoute.GET();

    expect(response.status).toBe(200);
    expectMetadataHeaders(response, "GET, OPTIONS");
    await expect(response.json()).resolves.toEqual({
      name: "PawSift",
      version: packageJson.version,
      endpoint: "/api/v1/audit",
      health: "/api/v1/health",
      examples: "/api/v1/examples",
      openapi: "/openapi.json",
      category: "Lifestyle",
      type: "A2MCP",
      boundary: BOUNDARY_TEXT,
      rulesetVersion: RULESET_VERSION
    });
  });

  it("supports OPTIONS for discovery clients", async () => {
    const response = await wellKnownRoute.OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-pawsift-ruleset")).toBe(RULESET_VERSION);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toBe("GET, OPTIONS");
    expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
    expect(response.headers.get("access-control-expose-headers")).toBe("x-pawsift-ruleset");
  });
});

describe("unsupported methods on public routes", () => {
  it.each([
    {
      label: "GET /api/v1/audit",
      handler: () => auditRoute.GET(),
      methods: "OPTIONS, POST"
    },
    {
      label: "DELETE /api/v1/audit",
      handler: () => auditRoute.DELETE(),
      methods: "OPTIONS, POST"
    },
    {
      label: "POST /api/v1/health",
      handler: () => healthRoute.POST(),
      methods: "GET, OPTIONS"
    },
    {
      label: "DELETE /api/v1/health",
      handler: () => healthRoute.DELETE(),
      methods: "GET, OPTIONS"
    },
    {
      label: "POST /api/v1/examples",
      handler: () => examplesRoute.POST(),
      methods: "GET, OPTIONS"
    },
    {
      label: "DELETE /api/v1/examples",
      handler: () => examplesRoute.DELETE(),
      methods: "GET, OPTIONS"
    },
    {
      label: "POST /openapi.json",
      handler: () => openApiRoute.POST(),
      methods: "GET, OPTIONS"
    },
    {
      label: "DELETE /openapi.json",
      handler: () => openApiRoute.DELETE(),
      methods: "GET, OPTIONS"
    },
    {
      label: "POST /.well-known/pawsift.json",
      handler: () => wellKnownRoute.POST(),
      methods: "GET, OPTIONS"
    },
    {
      label: "DELETE /.well-known/pawsift.json",
      handler: () => wellKnownRoute.DELETE(),
      methods: "GET, OPTIONS"
    }
  ])("$label returns a sanitized JSON 405 with the public header contract", async ({ handler, methods }) => {
    await expectMethodNotAllowedResponse(handler, methods);
  });
});
