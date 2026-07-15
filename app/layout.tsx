import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
);

export const metadata: Metadata = {
  metadataBase,
  title: "PawSift | Pet product fit, explained",
  description:
    "Deterministic listing audits for non-ingestible pet supplies with reproducible, ruleset-backed receipts.",
  applicationName: "PawSift",
  icons: {
    icon: "/brand/pawsift-mark-512-v2.png"
  },
  openGraph: {
    title: "PawSift | Pet product fit, explained",
    description:
      "Deterministic listing audits for non-ingestible pet supplies with reproducible, ruleset-backed receipts.",
    siteName: "PawSift",
    type: "website",
    images: [
      {
        url: "/brand/pawsift-mark-512-v2.png",
        width: 512,
        height: 512,
        alt: "PawSift"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "PawSift | Pet product fit, explained",
    description:
      "Deterministic listing audits for non-ingestible pet supplies with reproducible, ruleset-backed receipts.",
    images: ["/brand/pawsift-mark-512-v2.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
