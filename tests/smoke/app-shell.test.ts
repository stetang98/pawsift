import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { metadata } from "../../app/layout";
import HomePage from "../../app/page";

describe("application shell", () => {
  it("publishes the PawSift identity", () => {
    const configuredBase =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000");

    expect(metadata.title).toBe("PawSift | Pet product fit, explained");
    expect(metadata.description).toContain("non-ingestible pet supplies");
    expect(metadata.metadataBase?.toString()).toBe(new URL(configuredBase).toString());
    expect(metadata.icons).toEqual({
      icon: "/brand/pawsift-mark-512-v2.png"
    });
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/brand/pawsift-mark-512-v2.png",
        width: 512,
        height: 512,
        alt: "PawSift"
      }
    ]);
  });

  it("renders the main PawSift audit shell", () => {
    const markup = renderToStaticMarkup(HomePage());

    expect(markup).toContain("<main");
    expect(markup).toContain("<h1");
    expect(markup).toContain("PawSift");
    expect(markup).toContain("pawsift-mark-512-v2.png");
    expect(markup).toContain('width="32" height="32"');
    expect(markup).toContain('id="audit-console-root"');
  });
});
