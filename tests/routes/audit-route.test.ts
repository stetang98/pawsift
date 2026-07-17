import { describe, expect, it } from "vitest";

import * as auditRoute from "../../app/api/v1/audit/route";
import { auditProduct } from "../../src/domain/audit";
import {
  clearCatCollarFixture,
  missingMaterialsFixture,
  unsupportedClaimFixture
} from "../../src/domain/fixtures";
import { BOUNDARY_TEXT, RULESET_VERSION } from "../../src/domain/rules";
import { MAX_AUDIT_BODY_BYTES } from "../../src/http/errors";

const encoder = new TextEncoder();

function createJsonRequest(body: BodyInit): Request {
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body,
    duplex: "half"
  };

  return new Request("https://pawsift.test/api/v1/audit", init);
}

function createExactJsonString(byteLength: number): string {
  if (byteLength < 2) {
    throw new Error("JSON string bodies must be at least two bytes long.");
  }

  return `"${"a".repeat(byteLength - 2)}"`;
}

function createChunkedJsonRequest(chunks: Uint8Array[]): {
  request: Request;
  state: {
    pulls: number;
    cancelReason: unknown;
  };
} {
  const state = {
    pulls: 0,
    cancelReason: undefined as unknown
  };

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (state.pulls >= chunks.length) {
        controller.close();
        return;
      }

      controller.enqueue(chunks[state.pulls]);
      state.pulls += 1;
    },
    cancel(reason) {
      state.cancelReason = reason;
    }
  });

  return {
    request: createJsonRequest(stream),
    state
  };
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
  it("returns 200 with a deterministic result for the empty OKX.AI availability probe", async () => {
    const response = await auditRoute.POST(
      new Request("https://pawsift.test/api/v1/audit", {
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual(auditProduct(clearCatCollarFixture));
  });

  it("keeps a non-empty whitespace body on the invalid JSON path", async () => {
    const response = await auditRoute.POST(createJsonRequest("   "));

    expect(response.status).toBe(400);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON."
      }
    });
  });

  it("returns 200 and the shared clear fixture report for a valid request", async () => {
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(clearCatCollarFixture)));

    expect(response.status).toBe(200);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual(auditProduct(clearCatCollarFixture));
  });

  it("returns 200 for a caution verdict that remains inside the supported scope", async () => {
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(missingMaterialsFixture)));

    expect(response.status).toBe(200);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual(auditProduct(missingMaterialsFixture));
  });

  it("returns 400 for malformed JSON without leaking a stack trace", async () => {
    const response = await auditRoute.POST(createJsonRequest('{"pet":'));

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
    const response = await auditRoute.POST(
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

  it("allows a request body that is exactly 32768 raw bytes and only rejects it after parsing", async () => {
    const exactBody = createExactJsonString(MAX_AUDIT_BODY_BYTES);

    expect(Buffer.byteLength(exactBody, "utf8")).toBe(MAX_AUDIT_BODY_BYTES);

    const response = await auditRoute.POST(createJsonRequest(exactBody));

    expect(response.status).toBe(400);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: "Request body does not match the PawSift audit schema.",
        issues: [
          {
            path: "(root)",
            message: "Invalid input: expected object, received string"
          }
        ]
      }
    });
  });

  it("returns 413 when the raw request body is 32769 bytes before JSON parsing", async () => {
    const oversizedBody = createExactJsonString(MAX_AUDIT_BODY_BYTES + 1);

    expect(Buffer.byteLength(oversizedBody, "utf8")).toBe(MAX_AUDIT_BODY_BYTES + 1);

    const response = await auditRoute.POST(createJsonRequest(oversizedBody));

    expect(response.status).toBe(413);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body must be 32768 bytes or smaller."
      }
    });
  });

  it("returns 413 for a BOM-prefixed body whose decoded JSON would otherwise fit inside 32768 bytes", async () => {
    const exactBody = createExactJsonString(MAX_AUDIT_BODY_BYTES);
    const bomPrefixedBody = new Uint8Array([0xef, 0xbb, 0xbf, ...encoder.encode(exactBody)]);

    expect(bomPrefixedBody.byteLength).toBe(MAX_AUDIT_BODY_BYTES + 3);

    const response = await auditRoute.POST(createJsonRequest(bomPrefixedBody));

    expect(response.status).toBe(413);
    expectAuditHeaders(response);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body must be 32768 bytes or smaller."
      }
    });
  });

  it("returns 400 for invalid UTF-8 without leaking decoder details", async () => {
    const invalidUtf8Body = new Uint8Array([
      ...encoder.encode('{"pet":"'),
      0xc3,
      0x28,
      ...encoder.encode('"}')
    ]);

    const response = await auditRoute.POST(createJsonRequest(invalidUtf8Body));

    expect(response.status).toBe(400);
    expectAuditHeaders(response);

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON."
      }
    });
    expect(JSON.stringify(body)).not.toContain("TypeError");
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("cancels a chunked body stream as soon as the raw total crosses 32768 bytes", async () => {
    const { request, state } = createChunkedJsonRequest([
      encoder.encode("a".repeat(MAX_AUDIT_BODY_BYTES - 1)),
      encoder.encode("bb"),
      encoder.encode("never-read")
    ]);

    const response = await auditRoute.POST(request);

    expect(response.status).toBe(413);
    expectAuditHeaders(response);
    expect(state.pulls).toBe(2);
    expect(state.cancelReason).toBeDefined();
  });

  it("returns 422 with human-review guidance for explicitly unsupported non-veterinary scope", async () => {
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(unsupportedClaimFixture)));

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
      "Can you remove medical, treatment, or ingestible language from the submitted product listing?"
    );
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("returns 422 when unsupported scope language appears in the product name", async () => {
    const request = {
      pet: clearCatCollarFixture.pet,
      product: {
        ...clearCatCollarFixture.product,
        name: "Medicated Flea Treatment Collar",
        claims: ["adjustable"]
      }
    };
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(request)));

    expect(response.status).toBe(422);
    expectAuditHeaders(response);

    const body = await response.json();
    expect(body.error.code).toBe("UNSUPPORTED_SCOPE");
    expect(body.guidance.verdict).toBe("HUMAN_REVIEW");
    expect(body.guidance.findings.map((finding: { ruleId: string }) => finding.ruleId)).toEqual([
      "PS-008"
    ]);
    expect(body.guidance.findings[0].evidence).toContain(
      "product.name=Medicated Flea Treatment Collar"
    );
  });

  it("returns 200 caution guidance when a collar omits its supported weight range", async () => {
    const request = {
      pet: clearCatCollarFixture.pet,
      product: {
        name: clearCatCollarFixture.product.name,
        category: "collar_harness",
        intendedSpecies: clearCatCollarFixture.product.intendedSpecies,
        materials: clearCatCollarFixture.product.materials,
        breakaway: true,
        careInstructions: clearCatCollarFixture.product.careInstructions,
        claims: clearCatCollarFixture.product.claims
      }
    };
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(request)));

    expect(response.status).toBe(200);
    expectAuditHeaders(response);

    const body = await response.json();
    expect(body.verdict).toBe("CAUTION");
    expect(body.findings.map((finding: { ruleId: string }) => finding.ruleId)).toEqual(["PS-011"]);
    expect(body.missingFacts).toEqual(["minWeightKg", "maxWeightKg"]);
  });

  it("returns 422 for a realistic food product name", async () => {
    const request = {
      pet: clearCatCollarFixture.pet,
      product: {
        ...clearCatCollarFixture.product,
        name: "Premium Cat Food",
        claims: ["premium"]
      }
    };
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(request)));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.guidance.verdict).toBe("HUMAN_REVIEW");
    expect(body.guidance.findings[0].evidence).toContain("product.name=Premium Cat Food");
  });

  it("returns 422 when a generic food product name omits a species qualifier", async () => {
    const request = {
      pet: clearCatCollarFixture.pet,
      product: {
        ...clearCatCollarFixture.product,
        name: "Freeze-Dried Food",
        claims: ["premium"]
      }
    };
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(request)));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.guidance.verdict).toBe("HUMAN_REVIEW");
    expect(body.guidance.findings[0].evidence).toContain("product.name=Freeze-Dried Food");
    expect(body.guidance.findings[0].title).toBe(
      "Unsupported medical or ingestible wording detected"
    );
    expect(body.guidance.ownerQuestions).toContain(
      "Can you remove medical, treatment, or ingestible language from the submitted product listing?"
    );
  });

  it("does not let an ingestible qualifier hide behind an accessory suffix", async () => {
    const request = {
      pet: clearCatCollarFixture.pet,
      product: {
        ...clearCatCollarFixture.product,
        name: "Freeze-Dried Food Bowl",
        claims: ["premium"]
      }
    };
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(request)));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.guidance.verdict).toBe("HUMAN_REVIEW");
    expect(body.guidance.findings[0].evidence).toContain(
      "product.name=Freeze-Dried Food Bowl"
    );
  });

  it.each([
    "Duck Meat Treat Pouch",
    "Venison Food Bowl",
    "鹿肉 Food Bowl",
    "Freeze-Dried F​ood Bowl",
    "Venison Food​Bowl",
    "Duck Meat Treat​Pouch",
    "F​ood Bowl",
    "F​ood​Bowl",
    "Tre​at Pouch",
    "Medicated​Collar",
    "Medica​ted​Collar",
    "Flea​Treatment Collar",
    "s​afe​to​eat",
    "MedicatedCollar",
    "Freeze-Dried FoodBowl",
    "Venison FoodBowl",
    "Duck Meat TreatPouch",
    "Freeze_Dried Food_Bowl",
    "Venison Food_Bowl",
    "Duck Meat Treat_Pouch",
    "Freeze‑Dried Food Bowl",
    "Single‑Ingredient Treat Pouch"
  ])("returns 422 when ambiguous or Unicode-separated ingestible title %s mimics an accessory", async (name) => {
    const request = {
      pet: clearCatCollarFixture.pet,
      product: {
        ...clearCatCollarFixture.product,
        name,
        claims: ["premium"]
      }
    };
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(request)));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.guidance.verdict).toBe("HUMAN_REVIEW");
    expect(
      body.guidance.findings[0].evidence.some((evidence: string) =>
        evidence.startsWith(`product.name=${name}`)
      )
    ).toBe(true);
  });

  it.each([
    "Stainless Food-Bowls",
    "Treat-Storage Jars",
    "Cute 🐶‍🦺 Harness",
    "Health‍y Harness",
    "Foodie​ Harness",
    "Flea​Market Harness",
    "Stain​less Food Bowl"
  ])(
    "keeps the hyphenated accessory title %s in scope",
    async (name) => {
      const request = {
        pet: clearCatCollarFixture.pet,
        product: {
          ...clearCatCollarFixture.product,
          name,
          claims: ["adjustable"]
        }
      };
      const response = await auditRoute.POST(createJsonRequest(JSON.stringify(request)));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.verdict).toBe("CLEAR");
      expect(body.findings.map((finding: { ruleId: string }) => finding.ruleId)).toEqual([
        "PS-010"
      ]);
    }
  );

  it("returns bounded 422 guidance for a maximum-length unsupported product name", async () => {
    const name = `${"x".repeat(490)} medicated`;
    const request = {
      pet: clearCatCollarFixture.pet,
      product: {
        ...clearCatCollarFixture.product,
        name,
        claims: ["adjustable"]
      }
    };
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(request)));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.guidance.verdict).toBe("HUMAN_REVIEW");
    expect(body.guidance.findings[0].evidence[0]).toMatch(/^product\.name=matched:/);
    expect(body.guidance.findings[0].evidence[0].length).toBeLessThanOrEqual(500);
  });

  it("keeps the 422 guidance verdict at human review when a blocking rule also fires", async () => {
    const request = {
      pet: clearCatCollarFixture.pet,
      product: {
        ...clearCatCollarFixture.product,
        name: "Medicated Dog Collar",
        intendedSpecies: ["dog"]
      }
    };
    const response = await auditRoute.POST(createJsonRequest(JSON.stringify(request)));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.guidance.verdict).toBe("HUMAN_REVIEW");
    expect(body.guidance.findings.map((finding: { ruleId: string }) => finding.ruleId)).toEqual([
      "PS-001",
      "PS-008"
    ]);
  });
});

describe("OPTIONS /api/v1/audit", () => {
  it("returns permissive read-only CORS headers", async () => {
    const response = await auditRoute.OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-pawsift-ruleset")).toBe(RULESET_VERSION);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toBe("OPTIONS, POST");
    expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
    expect(response.headers.get("access-control-expose-headers")).toBe("x-pawsift-ruleset");
  });
});
