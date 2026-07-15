import { createHash } from "node:crypto";

export { canonicalize } from "./canonical-json";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
