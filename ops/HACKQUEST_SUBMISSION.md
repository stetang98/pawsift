# PawSift submission package

Competition: [OKX.AI Genesis Hackathon](https://www.hackquest.io/zh-cn/hackathons/OKXAI-Genesis-Hackathon)

Status: product, public deployment, and OKX.AI listing are verified. No timely Google Form receipt has been found, so competition eligibility is not yet proven. The 2026-07-16 X post and video are historical assets and must be replaced with the current-status v7 post before any update submission.

## Core fields

| Field | Exact value |
| --- | --- |
| Project name | `PawSift` |
| Tagline | `Know what fits before your pet finds out.` |
| Primary track | `Lifestyle Companion` |
| Secondary fit | `Best Product`, `Creative Genius` |
| Website | `https://pawsift.vercel.app` |
| Repository | `https://github.com/stetang98/pawsift` |
| API | `https://pawsift.vercel.app/api/v1/audit` |
| OpenAPI | `https://pawsift.vercel.app/openapi.json` |
| License | `MIT` |
| Builder | `Ste Tang` |
| GitHub | `stetang98` |
| X | `@Stetang3438` |
| Telegram | `@Stetang` |
| Historical demo URL | `https://x.com/Stetang3438/status/2077807252648656964` (published 2026-07-16; shows the former review state) |
| Current demo URL | Pending publication of reviewer-approved v7 |
| OKX.AI Agent ID | `6036` |
| OKX.AI listing | Verified by public `onchainos agent search`: Agent `6036`, Service `34579` |
| OKX.AI review state | `Listed — eligible for task recommendations`; Agent `active` |
| OKX.AI marketplace category | `LIFESTYLE` |

## Short description

PawSift is a free A2MCP service that audits non-ingestible cat and dog product listings against deterministic fit, disclosure, and scope rules. It returns explainable verdicts, seller-ready corrections, and reproducible SHA-256 receipts without requiring a wallet, model key, or user account.

## Full Markdown details

```markdown
# PawSift

**Know what fits before your pet finds out.**

![PawSift audit console](https://raw.githubusercontent.com/stetang98/pawsift/main/public/screens/pawsift-console-desktop-v1.png)

PawSift is a deterministic A2MCP product-fit and listing-quality audit for non-ingestible cat and dog supplies. A pet owner, seller, or shopping agent submits objective pet and product facts; PawSift returns a stable `CLEAR`, `CAUTION`, `BLOCK`, or `HUMAN_REVIEW` verdict with rule-level evidence, missing facts, owner questions, listing patches, and SHA-256 receipts.

## Why it matters

Pet-product listings often hide the facts that determine fit: supported species and weight, materials, detachable parts, batteries or magnets, care instructions, and unsupported safety claims. Generic chat answers are difficult to audit. PawSift turns the same decision into a structured, reproducible API result.

## What judges can verify

- Use the live Bybit-inspired operator console: https://pawsift.vercel.app
- Call the free A2MCP endpoint: https://pawsift.vercel.app/api/v1/audit
- Inspect the contract: https://pawsift.vercel.app/openapi.json
- Replay twelve checked-in fixtures: https://pawsift.vercel.app/api/v1/examples
- Recompute the content-addressed receipts from `proof/proof.json`
- Review the public MIT repository: https://github.com/stetang98/pawsift
- Historical 2026-07-16 demo: https://x.com/Stetang3438/status/2077807252648656964
- Current listed-state demo: pending publication of reviewer-approved v7

![PawSift mobile flow](https://raw.githubusercontent.com/stetang98/pawsift/main/public/screens/pawsift-console-mobile-v1.png)

## Safety boundary

PawSift is not veterinary advice. It does not approve food, treats, supplements, medication, pesticides, symptoms, treatment, or medical suitability. Unsupported medical or ingestible wording anywhere in the submitted product listing routes to `HUMAN_REVIEW`. `CLEAR` only means that no blocking or caution rule fired from the supplied facts.

## Technical execution

- Next.js App Router, React, and TypeScript
- Strict Zod input/output contracts and OpenAPI 3.1
- Versioned authored rules with stable IDs
- RFC 8785-aligned canonical JSON behavior and SHA-256 receipts
- Public CORS, payload limits, sanitized errors, HSTS, and no request persistence
- Reproducible proof bound to a pinned Git commit, Git blobs, deployment health, and hosted fixture hashes
- 203 automated tests plus 9 desktop/mobile browser flows

## OKX.AI integration

PawSift is listed as a free `A2MCP` service on OKX.AI. The official profile classifies Agent ID `6036` as `LIFESTYLE`, `active`, and `Listed — eligible for task recommendations`; public agent search returns Service `34579`. The endpoint remediation and approval evidence are recorded in `ops/OKX_REREVIEW_EVIDENCE.md` and `ops/OKX_LISTING_APPROVAL_EVIDENCE_v1.md`.

- Agent ID: `6036`
- Listing: public agent search result for Agent `6036`, Service `34579`
- Review state: `Listed — eligible for task recommendations`; Agent `active`
- Marketplace category: `LIFESTYLE`
- Endpoint: https://pawsift.vercel.app/api/v1/audit

## Honest launch state

The launch fee is `0` USDT. Observed sales are zero and there are no sales or payment transaction hashes. The separate identity-registration transaction is recorded in `ops/OKX_REGISTRATION_EVIDENCE.md`; no revenue or payment proof is claimed.
```

## Visual assets

| Use | Local path | Required format |
| --- | --- | --- |
| Square logo | `public/brand/pawsift-mark-512-v2.png` | PNG, 512 x 512 |
| Horizontal logo | `public/brand/pawsift-logo-512-v2.png` | PNG, 512 x 170 |
| Desktop screenshot | `public/screens/pawsift-console-desktop-v1.png` | PNG, 1440 x 1024 |
| Mobile screenshot | `public/screens/pawsift-console-mobile-v1.png` | PNG, 390 x 844 |
| Production desktop evidence | `artifacts/production/pawsift-production-desktop-v1.png` | PNG, 1440 x 1024 |
| Production mobile evidence | `artifacts/production/pawsift-production-mobile-v1.png` | PNG, 390 x 844 |

## Google Form fields

The live form was inspected on 2026-07-15. Every field below is required.

The official deadline was 2026-07-17 23:59 UTC. As of 2026-07-22, Gmail and Google Drive searches found no receipt proving that this form was submitted before the deadline. Do not represent PawSift as submission-ready unless a timely receipt or written organizer authorization for a late/update submission is obtained.

| Google Form field | Exact value |
| --- | --- |
| ASP Name | `PawSift` |
| Agent ID | `6036` |
| ASP Description | Use the ASP description in `ops/ASP_LISTING.md` verbatim |
| ASP Type | `A2MCP` |
| X Account Handle | `@Stetang3438` |
| X Participation Post (Link) | Pending publication of the reviewer-approved current-status v7 post |
| Telegram Handle | `@Stetang` |

Do not submit or update the form without preserving the resulting receipt and timestamp. A late submission does not establish eligibility unless the organizer explicitly accepts it.
