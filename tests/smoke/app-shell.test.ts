import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { metadata } from "../../app/layout";
import HomePage from "../../app/page";

describe("application shell", () => {
  it("publishes the PawSift identity", () => {
    expect(metadata.title).toBe("PawSift | Pet product fit, explained");
    expect(metadata.description).toContain("non-ingestible pet supplies");
  });

  it("renders the main PawSift audit shell", () => {
    const markup = renderToStaticMarkup(HomePage());

    expect(markup).toContain("<main");
    expect(markup).toContain("<h1>PawSift</h1>");
    expect(markup).toContain('id="audit-console-root"');
  });
});
