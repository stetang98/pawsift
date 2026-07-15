function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function compareCodeUnits(left: string, right: string): number {
  const limit = Math.min(left.length, right.length);

  for (let index = 0; index < limit; index += 1) {
    const leftCodeUnit = left.charCodeAt(index);
    const rightCodeUnit = right.charCodeAt(index);

    if (leftCodeUnit < rightCodeUnit) {
      return -1;
    }

    if (leftCodeUnit > rightCodeUnit) {
      return 1;
    }
  }

  if (left.length < right.length) {
    return -1;
  }

  if (left.length > right.length) {
    return 1;
  }

  return 0;
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
    .sort(compareCodeUnits)
    .map((key) => `${JSON.stringify(key)}:${toCanonicalString(value[key])}`)
    .join(",")}}`;
}

export function canonicalize(value: unknown): string {
  return toCanonicalString(value);
}
