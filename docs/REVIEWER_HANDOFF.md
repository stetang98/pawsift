# Reviewer handoff

## Competition

- Event: [OKX.AI Genesis Hackathon](https://www.hackquest.io/zh-cn/hackathons/OKXAI-Genesis-Hackathon)
- Official Google Form deadline: 2026-07-27 23:59 UTC
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
| ASP review/live listing | Verified 2026-07-22: `Listed — eligible for task recommendations`; Agent `active`; public search returns Service `34579` |
| Demo | Completed local v7 candidate pending external reviewer approval and publication; v6 is dated historical evidence only |
| X post | Historical 2026-07-16 post: `https://x.com/Stetang3438/status/2077807252648656964`; current post pending |
| HackQuest and Google Form | Pending; the official submission window remains open until 2026-07-27 23:59 UTC |

The OKX.AI listing blocker is closed by `ops/OKX_LISTING_APPROVAL_EVIDENCE_v1.md`. The remaining submission operations are external approval of v7, publishing the current X demo, and completing the Google Form before the official deadline.

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
11. Inspect `ops/DEMO_QC.md`, play the complete local v7 video, verify the live HTTP 200 response, current ruleset/receipts, official `LIFESTYLE` category, listed/active CLI evidence, full BT.709 signaling, and caption/narration alignment.

## Expected honest launch state

- Payment mode: `free_launch`.
- Observed sales: `0`.
- Sales/payment transaction hashes: none. The separate identity-registration transaction is documented in `ops/OKX_REGISTRATION_EVIDENCE.md` and is not revenue proof.
- No wallet or chain receipt is required for the service result.
- `CLEAR` is a rule result from supplied facts, not a medical safety certification.

## Feedback format

Return findings first, ordered `Blocker`, `High`, `Medium`, `Low`, with exact file and line references. End with one verdict: `not ready`, `ready after fixes`, or `ready to submit`. For every fix cycle, send the final verdict back to the PawSift implementation task so it can be evaluated and applied.
