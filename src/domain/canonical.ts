import { createHash } from "node:crypto";

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function toCanonicalString(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("canonicalize only accepts finite numbers");
    }

    return JSON.stringify(value);
  }

  if (
    value === undefined ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    throw new TypeError("canonicalize does not support undefined, functions, symbols, or bigint");
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => toCanonicalString(item)).join(",")}]`;
  }

  if (!isPlainObject(value)) {
    throw new TypeError("canonicalize only supports plain objects, arrays, and JSON primitives");
  }

  return `{${Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => `${JSON.stringify(key)}:${toCanonicalString(value[key])}`)
    .join(",")}}`;
}

export function canonicalize(value: unknown): string {
  return toCanonicalString(value);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
