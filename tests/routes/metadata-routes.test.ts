import { describe, expect, it } from "vitest";

import { GET as getWellKnown, OPTIONS as optionsWellKnown } from "../../app/.well-known/pawsift.json/route";
import { GET as getExamples } from "../../app/api/v1/examples/route";
import { GET as getHealth, OPTIONS as optionsHealth } from "../../app/api/v1/health/route";
import { GET as getOpenApi } from "../../app/openapi.json/route";
import { auditProduct } from "../../src/domain/audit";
import { AUDIT_FIXTURES, clearCatCollarFixture, missingMaterialsFixture, unsupportedClaimFixture } from "../../src/domain/fixtures";
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

describe("GET /api/v1/health", () => {
  it("publishes the A2MCP service identity and ruleset metadata", async () => {
    const response = await getHealth();

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
    const response = await optionsHealth();

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
    const response = await getExamples();

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
});

describe("GET /openapi.json", () => {
  it("publishes a contract whose examples stay pinned to shared fixtures and derived reports", async () => {
    const response = await getOpenApi();

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
});

describe("GET /.well-known/pawsift.json", () => {
  it("publishes service metadata, discovery links, and the non-veterinary boundary", async () => {
    const response = await getWellKnown();

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
    const response = await optionsWellKnown();

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-pawsift-ruleset")).toBe(RULESET_VERSION);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toBe("GET, OPTIONS");
    expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
    expect(response.headers.get("access-control-expose-headers")).toBe("x-pawsift-ruleset");
  });
});
