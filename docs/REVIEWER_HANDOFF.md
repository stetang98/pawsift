# Reviewer handoff

## Competition

- Event: [OKX.AI Genesis Hackathon](https://www.hackquest.io/zh-cn/hackathons/OKXAI-Genesis-Hackathon)
- Deadline: 2026-07-27 23:59 UTC
- Primary track: Lifestyle Companion
- Project: PawSift

Review the competition rules before evaluating the repository. An ASP that is not approved and live on OKX.AI is not submission-ready even if the code is complete.

## Product

PawSift is a deterministic fit and listing-quality audit for non-ingestible cat and dog supplies. It accepts structured pet and product facts and returns `CLEAR`, `CAUTION`, `BLOCK`, or `HUMAN_REVIEW`, stable rule findings, missing facts, owner questions, listing patches, and SHA-256 receipt hashes.

## Current external status

| Item | Status |
| --- | --- |
| Public GitHub repository | Live: `https://github.com/stetang98/pawsift` |
| Vercel HTTPS deployment | Live and verified: `https://pawsift.vercel.app` |
| OKX.AI identity and Agent ID | Registered: Agent ID `6036` |
| OKX.AI marketplace category | Verified by official CLI: `LIFESTYLE` |
| ASP review/live listing | First review rejected on 2026-07-17; remediation deployed; resubmission `Listing under review`; `not listed` |
| Demo | Reviewer-approved and published: `artifacts/demo/pawsift-demo-final-v6-v1.mp4` |
| X post | Published: `https://x.com/Stetang3438/status/2077807252648656964` |
| HackQuest and Google Form | Pending |

The remaining external eligibility blocker is OKX.AI listing approval. Do not convert that pending row into a completed claim without public evidence.

## Review commands

```bash
npm ci
npm run check
npm run test:e2e
npm run proof
npm test -- --run tests/proof/proof.test.ts
git diff --check
```

## Critical review targets

1. Confirm the public web console and `POST /api/v1/audit` call the same domain engine and fixtures.
2. Recompute receipt hashes from the exact downloaded canonical preimages.
3. Run `npm run proof` twice and confirm `proof/proof.json` stays byte-for-byte unchanged.
4. Mutate proof fields and confirm fake sales, transaction hashes, unsupported claims, wrong ruleset, stale hashes, arbitrary live origins, and incomplete source provenance fail validation.
5. Confirm all out-of-scope medical and ingestible wording across product name, materials, supervision, care, and claims routes to `HUMAN_REVIEW` with field-labeled evidence.
6. Confirm collars/harnesses without both weight bounds and carriers/beds without maximum supported weight cannot receive `CLEAR`.
7. Confirm every factual claim points to a source file whose Git blob and SHA-256 digest are bound to the audited commit.
8. Check that deployment, listing, sales, payment, and transaction claims match public evidence.
9. Exercise desktop plus 320 px and 390 px mobile layouts for overflow, overlap, keyboard use, and 44 px controls.
10. Scan tracked text for secrets, private keys, wallet material, and real API tokens.
11. Inspect `ops/DEMO_QC.md`, play the complete local `v6-v1` video, verify the live HTTP 200 response, current ruleset/receipts, official `LIFESTYLE` category, public-safe CLI evidence, full BT.709 signaling, caption/narration alignment, and that no frame implies OKX.AI approval.

## Expected honest launch state

- Payment mode: `free_launch`.
- Observed sales: `0`.
- Sales/payment transaction hashes: none. The separate identity-registration transaction is documented in `ops/OKX_REGISTRATION_EVIDENCE.md` and is not revenue proof.
- No wallet or chain receipt is required for the service result.
- `CLEAR` is a rule result from supplied facts, not a medical safety certification.

## Feedback format

Return findings first, ordered `Blocker`, `High`, `Medium`, `Low`, with exact file and line references. End with one verdict: `not ready`, `ready after fixes`, or `ready to submit`. For every fix cycle, send the final verdict back to the PawSift implementation task so it can be evaluated and applied.
