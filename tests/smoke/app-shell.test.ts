import { describe, expect, it } from "vitest";
import { metadata } from "../../app/layout";

describe("application shell", () => {
  it("publishes the PawSift identity", () => {
    expect(metadata.title).toBe("PawSift | Pet product fit, explained");
    expect(metadata.description).toContain("non-ingestible pet supplies");
  });
});
