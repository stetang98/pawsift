# PawSift Product Design

Date: 2026-07-15
Event: OKX.AI Genesis Hackathon
Owner: Ste Tang
Decision authority: the owner delegated product and implementation choices for this build.

## 1. Objective

Build and list a production-quality Agent-to-MCP service on OKX.AI. This historical design draft recorded a 2026-07-27 deadline, but the official HackQuest page later verified the required Google Form deadline as 2026-07-17 23:59 UTC. The service must solve a narrow real-world problem, be callable as a stable HTTPS API, return verifiable structured results, support a polished public demo, and be straightforward for OKX internal reviewers to exercise.

Primary award target: Lifestyle Companion.

Secondary award targets: Best Product and Creative Genius.

Revenue Rocket is not the primary target because a paid endpoint requires OKX facilitator credentials and marketplace sales history. PawSift will be payment-ready, but the launch endpoint will be free to maximize listing reliability before the deadline.

## 2. Verified Competition Constraints

- Total prize pool: 100,000 USDT.
- Verified official Google Form deadline: 2026-07-17 23:59 UTC. The earlier 2026-07-27 planning date was incorrect.
- The ASP must pass OKX.AI internal review and go live; an unapproved listing is ineligible.
- Required final fields: ASP name, Agent ID, ASP description, ASP type, X handle, X participation post URL, and Telegram handle.
- The X post must use `#OKXAI`, introduce the ASP, explain its use case, and include a demo or walkthrough no longer than 90 seconds.
- A separate video upload is not required.
- A2MCP is suitable for structured, low-risk, repeatable API work.
- A free A2MCP endpoint must return its result directly with HTTP 200.
- Listing review is stated to complete within 24 hours.

Official sources:

- https://www.hackquest.io/zh-cn/hackathons/OKXAI-Genesis-Hackathon
- https://www.okx.ai/tutorial
- https://web3.okx.com/zh-hans/onchainos/dev-docs/okxai/howtomcp
- https://web3.okx.com/zh-hans/onchainos/dev-docs/okxai/registerasp
- https://forms.gle/mddEUagmDbyV37ws8

## 3. Competitor Scan

The project gallery contained 17 entries when reviewed on 2026-07-15.

| Project | Direction | Competitive implication |
| --- | --- | --- |
| StableGuard | Uniswap v4 dynamic-fee protection | Finance/infra is crowded and chain-heavy. |
| Sentinel | Leveraged portfolio risk copilot | Direct finance competition. |
| VentureOS | Company-name and venture reality checks | Strong software utility competitor. |
| GovCoPilot | DAO proposal analysis with x402 | Governance and infra competitor. |
| SubmitGuard | Hackathon submission auditing | Strong software utility competitor. |
| SafeIntent LoopGuard | Pre-execution policy firewall | Security category is crowded. |
| docket arbiter | AI escrow verification | Finance/infra competitor. |
| StableRoute | Stablecoin route comparison | Finance competitor. |
| Cortex | Permanent agent memory | Infra competitor. |
| Pre-Flight Safety Scanner | Marketplace trust scanner | Security/infra competitor. |
| xbird | X access as paid MCP tools | Software/social competitor. |
| Falci Hatun | Deterministic astrology and tarot | Only clear Lifestyle project; strong but entertainment-focused. |
| Guardian | Transaction firewall | Security competitor. |
| customer discovery agent | Reddit market validation | Software utility competitor. |
| ExitGuard | Pre-trade exit-liquidity proof | Finance/security competitor. |
| LICENSE402 | Machine-readable rights licensing | Creative/infra competitor. |
| teste 11 copy | Minimal test submission | Low competitive relevance. |

Conclusion: finance, agent security, and general software utility are congested. Lifestyle has three 2,500 USDT winners and only one clear current competitor. A practical pet-supply decision service is differentiated from astrology while still fitting a repeated consumer workflow.

## 4. Considered Directions

### A. PawSift, pet-product fit and listing audit

Pros: least crowded category, authentic domain fit, repeated consumer and seller demand, deterministic and reviewer-friendly, safe to demo without wallet funds.

Cons: must stay outside veterinary diagnosis and ingestible products.

### B. Founder reality-check service

Pros: straightforward API and clear willingness to pay.

Cons: directly overlaps VentureOS and customer discovery agent.

### C. Agent transaction safety service

Pros: strong OKX ecosystem relevance.

Cons: Guardian, SafeIntent LoopGuard, ExitGuard, and Pre-Flight Safety Scanner already occupy this space.

Decision: build PawSift.

## 5. Product Definition

PawSift is an explainable compatibility and listing-quality service for non-ingestible pet supplies. A user or commerce agent submits a pet profile and product facts. PawSift returns a deterministic fit verdict, evidence-backed flags, missing-information questions, supervision guidance, seller-copy corrections, and a content-addressed audit receipt.

Tagline: Know what fits before your pet finds out.

Primary users:

- Pet owners comparing toys, carriers, beds, feeders, collars, harnesses, and grooming tools.
- Ecommerce sellers checking whether a listing exposes enough information for a safe buying decision.
- Shopping agents that need structured facts instead of free-form advice.

## 6. Safety Boundary

PawSift is not veterinary advice and does not assess food, supplements, medication, pesticides, chemical treatments, or symptoms.

It only evaluates supplied product facts and objective fit/completeness rules. It never claims that a product is medically safe. `CLEAR` means no blocking issue was found in the supplied facts, not that all hazards are absent.

Unsupported or high-risk inputs return `HUMAN_REVIEW` with a precise reason.

## 7. Core Experience

1. Choose a representative pet profile or enter one manually.
2. Enter product category, dimensions, materials, fit range, detachable-part facts, care instructions, and listing claims.
3. Run an audit.
4. Read a stable verdict: `CLEAR`, `CAUTION`, `BLOCK`, or `HUMAN_REVIEW`.
5. Inspect rule-level evidence, missing fields, owner questions, and corrected listing copy.
6. Copy or download the canonical JSON receipt.

The public web console uses realistic fixtures and calls the same production API that OKX.AI will call.

## 8. Architecture

### Web application

- Next.js App Router and TypeScript.
- Responsive operator console with a compact input workspace and result pane.
- Bybit-inspired trading-terminal visual language grounded in the live homepage captured on 2026-07-15: black canvas, charcoal tools, white data, warm orange primary actions, and semantic green/red states.
- Inter typography, compact 14 px operational copy, disciplined 8 px-or-smaller radii, thin low-contrast dividers, and dense rows that favor scanning over marketing composition.
- Desktop uses a restrained 56 px dark command bar, an audit ticket on the left, and a sticky verdict/receipt market panel on the right. Mobile collapses to a single form-then-result flow.
- The first viewport is the usable audit console. It does not reproduce Bybit trademarks, exchange copy, charts, token symbols, or source assets.
- No decorative gradients, oversized marketing hero, nested cards, or ornamental blobs.

Visual references:

- `docs/references/bybit-home-desktop-top-2026-07-15.png`
- `docs/references/bybit-home-desktop-cards-2026-07-15.png`

### A2MCP API

- `POST /api/v1/audit`: free production audit endpoint, HTTP 200 on valid requests.
- `GET /api/v1/health`: deployment and ruleset health.
- `GET /api/v1/examples`: reviewer-ready fixtures.
- `GET /openapi.json`: machine-readable contract.
- `GET /.well-known/pawsift.json`: service metadata and safety boundary.

### Domain engine

- Zod request and response schemas.
- Versioned authored rules with stable IDs.
- Category-specific validators for toy, carrier, bed, feeder, collar/harness, and grooming tool.
- Deterministic scoring and verdict resolution.
- Canonical JSON serialization and SHA-256 audit receipt.
- No cloud model, private key, or third-party API required in the request path.

### Payment readiness

- A documented adapter boundary for the official OKX x402 middleware.
- Launch endpoint remains free until facilitator credentials and a payment wallet are configured.
- No simulated payment or revenue claim.

## 9. API Contract

Request summary:

```json
{
  "pet": {
    "species": "cat",
    "lifeStage": "adult",
    "weightKg": 4.8,
    "traits": ["strong_chewer"]
  },
  "product": {
    "name": "Breakaway Reflective Collar",
    "category": "collar_harness",
    "intendedSpecies": ["cat"],
    "materials": ["nylon", "zinc_alloy"],
    "minWeightKg": 2.5,
    "maxWeightKg": 7,
    "breakaway": true,
    "careInstructions": "Hand wash and air dry",
    "claims": ["adjustable", "reflective"]
  }
}
```

Response summary:

```json
{
  "verdict": "CLEAR",
  "score": 92,
  "rulesetVersion": "2026.07.2",
  "findings": [],
  "missingFacts": [],
  "ownerQuestions": [],
  "listingPatch": [],
  "boundary": "Non-veterinary product-fit audit based only on supplied facts.",
  "receipt": {
    "algorithm": "sha256",
    "inputHash": "...",
    "reportHash": "..."
  }
}
```

## 10. Error Handling

- Invalid JSON: HTTP 400 with stable error code and field issues.
- Unsupported category or ingestible/medical product: HTTP 422 with `HUMAN_REVIEW` guidance.
- Oversized payload: HTTP 413.
- Internal failure: HTTP 500 with correlation ID and no stack trace.
- The UI preserves input and presents actionable corrections.

## 11. Test Strategy

- Unit tests for every rule and verdict precedence.
- Property tests for score bounds, stable ordering, and deterministic hashes.
- Contract tests for request/response schemas and OpenAPI examples.
- Route tests for status codes, CORS, headers, and error sanitization.
- E2E tests for the three primary demo flows.
- Accessibility checks for labels, keyboard use, focus, and color-independent status text.
- Desktop and mobile screenshot QA before release.

## 12. Submission Deliverables

- Public GitHub repository under `stetang98`.
- Vercel production URL and live API endpoint.
- OKX.AI A2MCP identity and approved listing ID.
- HackQuest project page with logo, screenshots, description, stack, repository, deployment, and demo.
- Up-to-90-second demo with natural narration and synchronized English subtitles.
- X participation post using `#OKXAI` and embedding the demo.
- Google Form submission record.
- Reviewer handoff, review reports, fixes, and final readiness verdict.

## 13. Acceptance Criteria

- A fresh `npm ci` succeeds.
- Lint, typecheck, unit tests, build, and E2E tests pass.
- The deployed API returns the documented result for checked-in fixtures.
- Audit receipts are reproducible across local and hosted runs.
- No secrets are tracked.
- Public claims match checked-in proof.
- OKX.AI listing is live before the hackathon form is submitted.
- The final video is at most 90 seconds and can be watched without authentication.
