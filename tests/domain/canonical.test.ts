import { describe, expect, it } from "vitest";

import { canonicalize, sha256 } from "../../src/domain/canonical";

describe("canonicalize", () => {
  it("canonicalizes keys independently of insertion order", () => {
    expect(canonicalize({ b: 2, a: 1 })).toBe(canonicalize({ a: 1, b: 2 }));
  });

  it("sorts nested object keys lexicographically while preserving array order", () => {
    const value = {
      z: [{ b: 2, a: 1 }, { d: 4, c: 3 }],
      a: { y: true, x: null }
    };

    expect(canonicalize(value)).toBe(
      '{"a":{"x":null,"y":true},"z":[{"a":1,"b":2},{"c":3,"d":4}]}'
    );
  });

  it("rejects undefined values anywhere in the input graph", () => {
    expect(() => canonicalize(undefined)).toThrow();
    expect(() => canonicalize({ ok: 1, bad: undefined })).toThrow();
    expect(() => canonicalize([1, undefined, 3])).toThrow();
  });

  it("rejects functions and symbols", () => {
    expect(() => canonicalize(() => "nope")).toThrow();
    expect(() => canonicalize(Symbol("nope"))).toThrow();
    expect(() => canonicalize({ ok: 1, bad: Symbol("x") })).toThrow();
  });

  it("rejects non-finite numbers", () => {
    expect(() => canonicalize(Number.NaN)).toThrow();
    expect(() => canonicalize(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => canonicalize({ ok: 1, bad: Number.NEGATIVE_INFINITY })).toThrow();
  });
});

describe("sha256", () => {
  it("returns a lowercase sha-256 digest", () => {
    expect(sha256("PawSift")).toBe(
      "612935ae283513a8dc374a6c451612adcda8127f0fbf5c194e06d88f73c20657"
    );
  });
});
