import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawSift | Pet product fit, explained",
  description:
    "Deterministic listing audits for non-ingestible pet supplies with reproducible, ruleset-backed receipts.",
  applicationName: "PawSift",
  openGraph: {
    title: "PawSift | Pet product fit, explained",
    description:
      "Deterministic listing audits for non-ingestible pet supplies with reproducible, ruleset-backed receipts.",
    siteName: "PawSift",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "PawSift | Pet product fit, explained",
    description:
      "Deterministic listing audits for non-ingestible pet supplies with reproducible, ruleset-backed receipts."
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
