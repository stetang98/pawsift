import { describe, expect, it } from "vitest";

import { POST, OPTIONS } from "../../app/api/v1/audit/route";
import { auditProduct } from "../../src/domain/audit";
import {
  clearCatCollarFixture,
  missingMaterialsFixture,
  unsupportedClaimFixture
} from "../../src/domain/fixtures";
import { BOUNDARY_TEXT, RULESET_VERSION } from "../../src/domain/rules";

function createJsonRequest(body: string): Request {
  return new Request("https://pawsift.test/api/v1/audit", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body
  });
}

function expectAuditHeaders(response: Response): void {
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-pawsift-ruleset")).toBe(RULESET_VERSION);
  expect(response.headers.get("access-control-allow-origin")).toBe("*");
  expect(response.headers.get("access-control-allow-methods")).toBe("OPTIONS, POST");
  expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
  expect(response.headers.get("access-control-expose-headers")).toBe("x-pawsift-ruleset");
}

describe("POST /api/v1/audit", () => {
  it("returns 200 and the shared clear fixture report for a valid request", async () => {
    const response = await POST(createJsonRequest(JSON.stringify(clearCatCollarFixture)));

    expect(response.status).toBe(200);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual(auditProduct(clearCatCollarFixture));
  });

  it("returns 200 for a caution verdict that remains inside the supported scope", async () => {
    const response = await POST(createJsonRequest(JSON.stringify(missingMaterialsFixture)));

    expect(response.status).toBe(200);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual(auditProduct(missingMaterialsFixture));
  });

  it("returns 400 for malformed JSON without leaking a stack trace", async () => {
    const response = await POST(createJsonRequest('{"pet":'));

    expect(response.status).toBe(400);
    expectAuditHeaders(response);

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON."
      }
    });
    expect(JSON.stringify(body)).not.toContain("stack");
    expect(JSON.stringify(body)).not.toContain("SyntaxError");
  });

  it("returns 400 for schema violations with field issues", async () => {
    const response = await POST(
      createJsonRequest(
        JSON.stringify({
          pet: {
            ...clearCatCollarFixture.pet,
            nickname: "Mochi"
          },
          product: clearCatCollarFixture.product
        })
      )
    );

    expect(response.status).toBe(400);
    expectAuditHeaders(response);

    const body = await response.json();
    expect(body.error.code).toBe("INVALID_REQUEST");
    expect(body.error.message).toBe("Request body does not match the PawSift audit schema.");
    expect(body.error.issues).toEqual([
      {
        path: "pet.nickname",
        message: "Unrecognized key: \"nickname\""
      }
    ]);
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("returns 413 when the raw request body exceeds 32 KiB before JSON parsing", async () => {
    const oversizedInvalidJson = `{"payload":"${"你".repeat(11_000)}`;

    expect(Buffer.byteLength(oversizedInvalidJson, "utf8")).toBeGreaterThan(32 * 1024);

    const response = await POST(createJsonRequest(oversizedInvalidJson));

    expect(response.status).toBe(413);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body must be 32768 bytes or smaller."
      }
    });
  });

  it("returns 422 with human-review guidance for explicitly unsupported non-veterinary scope", async () => {
    const response = await POST(createJsonRequest(JSON.stringify(unsupportedClaimFixture)));

    expect(response.status).toBe(422);
    expectAuditHeaders(response);

    const body = await response.json();
    expect(body.error).toEqual({
      code: "UNSUPPORTED_SCOPE",
      message: "Request falls outside PawSift's supported non-veterinary scope."
    });
    expect(body.guidance.verdict).toBe("HUMAN_REVIEW");
    expect(body.guidance.boundary).toBe(BOUNDARY_TEXT);
    expect(body.guidance.rulesetVersion).toBe(RULESET_VERSION);
    expect(body.guidance.findings.map((finding: { ruleId: string }) => finding.ruleId)).toEqual([
      "PS-008"
    ]);
    expect(body.guidance.ownerQuestions).toContain(
      "Can you remove medical, treatment, or ingestible language from the claims?"
    );
    expect(JSON.stringify(body)).not.toContain("stack");
  });
});

describe("OPTIONS /api/v1/audit", () => {
  it("returns permissive read-only CORS headers", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-pawsift-ruleset")).toBe(RULESET_VERSION);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toBe("OPTIONS, POST");
    expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
    expect(response.headers.get("access-control-expose-headers")).toBe("x-pawsift-ruleset");
  });
});
