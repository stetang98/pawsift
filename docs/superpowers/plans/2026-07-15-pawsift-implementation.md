# PawSift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test, deploy, list, and submit a deterministic pet-product fit and listing-audit A2MCP service for the OKX.AI Genesis Hackathon.

**Architecture:** A Next.js application exposes a public console and a versioned JSON API. A pure TypeScript domain package validates requests, runs authored category rules, resolves a stable verdict, and emits canonical SHA-256 receipts; route handlers only translate HTTP concerns. The hosted endpoint is free for launch and contains a documented adapter boundary for future OKX x402 middleware.

**Tech Stack:** Next.js 16.2.10, React 19.2.7, TypeScript, Zod 4.4.3, Vitest 4.1.10, fast-check 4.9.0, Playwright 1.61.1, Lucide React 1.24.0, Vercel.

## Global Constraints

- Submit before 2026-07-17 23:59 UTC.
- The production A2MCP endpoint must return HTTP 200 directly and require no secret.
- Supported products are non-ingestible pet supplies only.
- The service must not make veterinary, medical, food, supplement, pesticide, or treatment claims.
- Every verdict must be reproducible from supplied facts and a versioned ruleset.
- Every code change must pass an independent code-review gate before release.
- The public UI and API must use the same domain engine and checked-in fixtures.
- No tracked secret, private key, fake payment, fake sale, or unsupported chain claim.
- The demo must be no longer than 90 seconds and must match the deployed product.

---

## File Map

- `package.json`: pinned dependencies and verification scripts.
- `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`: build and test contracts.
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`: public web application shell.
- `app/api/v1/audit/route.ts`: A2MCP audit endpoint.
- `app/api/v1/health/route.ts`: liveness and ruleset metadata.
- `app/api/v1/examples/route.ts`: reviewer fixtures.
- `app/openapi.json/route.ts`: machine-readable HTTP contract.
- `app/.well-known/pawsift.json/route.ts`: ASP metadata and safety boundary.
- `src/domain/schemas.ts`: all request, response, finding, and error schemas.
- `src/domain/canonical.ts`: stable JSON serialization and SHA-256 hashing.
- `src/domain/rules.ts`: versioned rule definitions.
- `src/domain/audit.ts`: rule execution, score calculation, and verdict precedence.
- `src/domain/fixtures.ts`: demo and contract fixtures.
- `src/http/errors.ts`: sanitized API error mapping.
- `components/AuditConsole.tsx`: form state, API call, and result orchestration.
- `components/PetProfileForm.tsx`, `components/ProductForm.tsx`: accessible inputs.
- `components/AuditResult.tsx`, `components/FindingList.tsx`: result presentation.
- `components/JsonReceipt.tsx`: canonical JSON copy/download surface.
- `tests/domain/*.test.ts`: unit and property coverage.
- `tests/routes/*.test.ts`: route and contract coverage.
- `e2e/audit-console.spec.ts`: desktop and mobile user journeys.
- `scripts/export-proof.ts`: checked-in deployment proof generator.
- `public/brand/*`, `public/screens/*`: generated brand asset and verified screenshots.
- `docs/COMPETITOR_ANALYSIS.md`, `docs/ARCHITECTURE.md`, `docs/SAFETY.md`: judge-facing evidence.
- `ops/ASP_LISTING.md`, `ops/HACKQUEST_SUBMISSION.md`, `ops/X_POST.md`, `ops/DEMO_SCRIPT.md`: literal platform copy.

---

### Task 1: Project Foundation and Verification Harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Test: `tests/smoke/app-shell.test.ts`

**Interfaces:**
- Produces scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, and `check`.
- Produces the root layout metadata consumed by deployment and social cards.

- [ ] **Step 1: Write the smoke test**

```ts
import { describe, expect, it } from "vitest";
import { metadata } from "../../app/layout";

describe("application shell", () => {
  it("publishes the PawSift identity", () => {
    expect(metadata.title).toBe("PawSift | Pet product fit, explained");
    expect(metadata.description).toContain("non-ingestible pet supplies");
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/smoke/app-shell.test.ts`

Expected: FAIL because the application files do not exist.

- [ ] **Step 3: Create the Next.js shell and pinned package scripts**

`package.json` must include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "check": "npm run lint && npm run typecheck && npm test && npm run build"
  }
}
```

The initial page renders a semantic `<main>` with the product name and an empty console mount; it contains no marketing-only hero.

- [ ] **Step 4: Install dependencies and run verification**

Run: `npm install`

Run: `npm test -- tests/smoke/app-shell.test.ts && npm run typecheck && npm run build`

Expected: all commands pass.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs vitest.config.ts playwright.config.ts .gitignore .env.example app tests/smoke
git commit -m "chore: scaffold PawSift application"
```

---

### Task 2: Request Schemas and Canonical Receipts

**Files:**
- Create: `src/domain/schemas.ts`
- Create: `src/domain/canonical.ts`
- Test: `tests/domain/schemas.test.ts`
- Test: `tests/domain/canonical.test.ts`

**Interfaces:**
- Produces `AuditRequest`, `AuditResponse`, `Finding`, `Verdict`, and their Zod schemas.
- Produces `canonicalize(value: unknown): string` and `sha256(value: string): string`.

- [ ] **Step 1: Write failing schema and determinism tests**

```ts
it("rejects ingestible categories", () => {
  expect(() => auditRequestSchema.parse({ pet: validPet, product: { ...validProduct, category: "food" } })).toThrow();
});

it("canonicalizes keys independently of insertion order", () => {
  expect(canonicalize({ b: 2, a: 1 })).toBe(canonicalize({ a: 1, b: 2 }));
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `npm test -- tests/domain/schemas.test.ts tests/domain/canonical.test.ts`

Expected: FAIL with missing modules.

- [ ] **Step 3: Implement exact schemas**

Supported `species`: `cat`, `dog`.

Supported `category`: `toy`, `carrier`, `bed`, `feeder`, `collar_harness`, `grooming_tool`.

Verdicts: `CLEAR`, `CAUTION`, `BLOCK`, `HUMAN_REVIEW`.

Findings contain `ruleId`, `severity`, `title`, `reason`, `evidence`, and `remediation`.

Reject unknown keys at the request boundary and cap all free text at 500 characters.

- [ ] **Step 4: Implement recursive canonicalization and lowercase SHA-256**

Arrays preserve order. Object keys sort lexicographically. `undefined`, functions, and symbols are rejected. Numbers must be finite.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- tests/domain/schemas.test.ts tests/domain/canonical.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain tests/domain
git commit -m "feat: define audit schemas and receipts"
```

---

### Task 3: Versioned Rule Engine

**Files:**
- Create: `src/domain/rules.ts`
- Create: `src/domain/audit.ts`
- Create: `src/domain/fixtures.ts`
- Test: `tests/domain/rules.test.ts`
- Test: `tests/domain/audit.property.test.ts`

**Interfaces:**
- Consumes `AuditRequest` and canonical helpers.
- Produces `RULESET_VERSION`, `RULES`, and `auditProduct(input: AuditRequest): AuditResponse`.

- [ ] **Step 1: Write failing behavior tests**

Cover these stable rules:

```text
PS-001 species mismatch -> BLOCK
PS-002 pet weight outside declared product range -> BLOCK
PS-003 missing materials -> CAUTION
PS-004 toy with detachable parts and no supervision statement -> CAUTION
PS-005 battery or magnet disclosure -> HUMAN_REVIEW
PS-006 cat collar without breakaway fact -> CAUTION
PS-007 carrier below pet weight -> BLOCK
PS-008 unsupported medical/ingestible claim -> HUMAN_REVIEW
PS-009 missing care instructions -> CAUTION
PS-010 complete in-range listing -> CLEAR
```

- [ ] **Step 2: Confirm tests fail**

Run: `npm test -- tests/domain/rules.test.ts`

Expected: FAIL with missing engine.

- [ ] **Step 3: Implement rules as data**

Each rule is a pure object with stable ID, applies predicate, finding builder, score penalty, and verdict floor. Rules sort findings by severity then ID.

- [ ] **Step 4: Implement verdict and score resolution**

Precedence: `BLOCK` > `HUMAN_REVIEW` > `CAUTION` > `CLEAR`.

Score begins at 100, subtracts unique rule penalties, and clamps to 0-100. The report hash excludes timestamps so identical input produces identical output.

- [ ] **Step 5: Add property tests**

Use fast-check to prove score bounds, deterministic hashes, stable finding order, and unchanged verdict when object key insertion order changes.

- [ ] **Step 6: Run domain suite**

Run: `npm test -- tests/domain`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain tests/domain
git commit -m "feat: add explainable pet fit engine"
```

---

### Task 4: Public A2MCP HTTP Contract

**Files:**
- Create: `src/http/errors.ts`
- Create: `app/api/v1/audit/route.ts`
- Create: `app/api/v1/health/route.ts`
- Create: `app/api/v1/examples/route.ts`
- Create: `app/openapi.json/route.ts`
- Create: `app/.well-known/pawsift.json/route.ts`
- Test: `tests/routes/audit-route.test.ts`
- Test: `tests/routes/metadata-routes.test.ts`

**Interfaces:**
- `POST /api/v1/audit` consumes the strict request schema and returns `AuditResponse`.
- Metadata routes expose service name, version, endpoint, category `Lifestyle`, type `A2MCP`, and the non-veterinary boundary.

- [ ] **Step 1: Write route tests**

Tests must assert HTTP 200 for valid fixtures, 400 for malformed JSON/schema errors, 413 for payloads over 32 KiB, 422 for explicitly unsupported scopes, JSON content type, permissive read-only CORS, and no stack trace in errors.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- tests/routes`

Expected: FAIL with missing route modules.

- [ ] **Step 3: Implement handlers**

Every response includes `x-pawsift-ruleset` and `cache-control: no-store`. OPTIONS returns the documented CORS headers. The audit route never reads environment secrets.

- [ ] **Step 4: Generate OpenAPI from the same schemas/examples**

The OpenAPI document declares the exact JSON shapes, all status codes, one `CLEAR` example, one `CAUTION` example, and one `HUMAN_REVIEW` example.

- [ ] **Step 5: Run route and domain tests**

Run: `npm test -- tests/routes tests/domain`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api app/openapi.json app/.well-known src/http tests/routes
git commit -m "feat: expose PawSift A2MCP API"
```

---

### Task 5: Operator Console

**Files:**
- Create: `components/AuditConsole.tsx`
- Create: `components/PetProfileForm.tsx`
- Create: `components/ProductForm.tsx`
- Create: `components/AuditResult.tsx`
- Create: `components/FindingList.tsx`
- Create: `components/JsonReceipt.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `e2e/audit-console.spec.ts`

**Interfaces:**
- Consumes `/api/v1/examples` and `/api/v1/audit`.
- Produces a keyboard-accessible audit flow and copy/download receipt actions.

- [ ] **Step 1: Write failing E2E journeys**

```ts
test("audits a cat collar fixture", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load collar example" }).click();
  await page.getByRole("button", { name: "Run audit" }).click();
  await expect(page.getByRole("heading", { name: "CLEAR" })).toBeVisible();
  await expect(page.getByText("PS-010")).toBeVisible();
});
```

Add one caution flow and one unsupported-scope flow.

- [ ] **Step 2: Run and confirm failure**

Run: `npm run test:e2e -- e2e/audit-console.spec.ts`

Expected: FAIL because controls do not exist.

- [ ] **Step 3: Implement the forms**

Use labeled selects, checkboxes, numeric inputs, and textareas. Numeric fields retain stable dimensions. Presets populate visible values and can still be edited.

- [ ] **Step 4: Implement result rendering**

Always show verdict text and icon, not color alone. Findings show stable rule IDs, supplied evidence, and remediation. The receipt view exposes both hashes and canonical JSON.

- [ ] **Step 5: Implement responsive layout**

Desktop: compact two-column workspace with a sticky result pane.

Mobile: one-column flow with form before result, no horizontal scrolling, 44 px minimum touch targets, and no overlapping fixed elements.

- [ ] **Step 6: Run E2E and accessibility checks**

Run: `npm run test:e2e -- e2e/audit-console.spec.ts`

Expected: PASS at desktop and mobile projects.

- [ ] **Step 7: Commit**

```bash
git add components app/page.tsx app/globals.css e2e
git commit -m "feat: build PawSift audit console"
```

---

### Task 6: Brand Asset and Visual QA

**Files:**
- Create: `public/brand/pawsift-logo-512-v1.png`
- Create: `public/brand/pawsift-mark-512-v1.png`
- Create: `public/screens/pawsift-console-desktop-v1.png`
- Create: `public/screens/pawsift-console-mobile-v1.png`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `docs/DESIGN_QA.md`

**Interfaces:**
- Produces upload-ready PNG assets and repository-backed submission screenshots.

- [ ] **Step 1: Generate the original logo with ImageGen**

Art direction: a precise black-and-white sieve/check motif shaped by two paw pads, one restrained lime signal, no mascot face, no gradient, no text in the mark, legible at 48 px, square 512 px raster output.

- [ ] **Step 2: Integrate the asset at measured sizes**

Use a 32 px header mark and a 512 px social image. Preserve aspect ratio and provide descriptive alt text.

- [ ] **Step 3: Capture desktop and mobile screenshots**

Viewport targets: 1440x1024 and 390x844. Capture the loaded collar example with a visible result.

- [ ] **Step 4: Compare and fix**

Inspect for cropped controls, bad padding, text overflow, weak contrast, font-weight inconsistency, nested cards, and layout shifts. Record final checks in `docs/DESIGN_QA.md`.

- [ ] **Step 5: Commit**

```bash
git add public app docs/DESIGN_QA.md
git commit -m "design: finalize PawSift brand and responsive UI"
```

---

### Task 7: Evidence, Documentation, and Proof Export

**Files:**
- Create: `scripts/export-proof.ts`
- Create: `proof/proof.json`
- Create: `README.md`
- Create: `LICENSE`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/SAFETY.md`
- Create: `docs/COMPETITOR_ANALYSIS.md`
- Create: `docs/REVIEWER_HANDOFF.md`
- Test: `tests/proof/proof.test.ts`

**Interfaces:**
- Produces a machine-readable `proof.json` derived from tests, fixtures, ruleset, public URLs, and git commit.

- [ ] **Step 1: Write proof integrity tests**

Reject missing commit, non-HTTPS endpoint, unrecognized ruleset, mismatched fixture hashes, fake sales counts, fake tx hashes, and claims without source paths.

- [ ] **Step 2: Implement the exporter**

The exporter runs audited fixtures through `auditProduct`, records exact hashes, verification commands, deployment status, and truthful payment mode `free_launch`.

- [ ] **Step 3: Write judge-facing docs**

README order: live demo, one-call API example, why it matters, how it works, safety boundary, verified proof, local setup, OKX.AI integration, and license.

- [ ] **Step 4: Run proof and full checks**

Run: `npm run check && npm run proof && npm test -- tests/proof/proof.test.ts`

Expected: PASS and `proof/proof.json` is regenerated without uncommitted source changes.

- [ ] **Step 5: Commit**

```bash
git add scripts proof README.md LICENSE THIRD_PARTY_NOTICES.md docs tests/proof package.json
git commit -m "docs: publish reproducible PawSift evidence"
```

---

### Task 8: Public Release and Hosted Verification

**Files:**
- Create: `vercel.json` only if route behavior requires it.
- Modify: `proof/proof.json` with verified deployment URL.
- Create: `ops/DEPLOYMENT.md`

**Interfaces:**
- Produces the public repository and HTTPS Vercel endpoint used by OKX.AI.

- [ ] **Step 1: Create the public GitHub repository**

Run: `gh repo create stetang98/pawsift --public --source=. --remote=origin --push`

Expected: repository URL `https://github.com/stetang98/pawsift`.

- [ ] **Step 2: Deploy production**

Run: `vercel --prod --yes`

Expected: a stable HTTPS project URL.

- [ ] **Step 3: Verify hosted contracts**

Run HTTP checks for health, examples, OpenAPI, metadata, valid audit, invalid audit, and payload cap. Compare hosted fixture hashes to local proof.

- [ ] **Step 4: Run browser QA against production**

Verify desktop and mobile primary flows, no console errors, images loaded, and no blank states.

- [ ] **Step 5: Update proof and push**

Run: `npm run proof && git add proof ops/DEPLOYMENT.md && git commit -m "release: verify PawSift production deployment" && git push`

Expected: clean worktree and public main matches the recorded commit.

---

### Task 9: Listing, Demo, Submission, and Review Loop

**Files:**
- Create: `ops/ASP_LISTING.md`
- Create: `ops/HACKQUEST_SUBMISSION.md`
- Create: `ops/X_POST.md`
- Create: `ops/DEMO_SCRIPT.md`
- Create: `artifacts/demo/pawsift-demo-v1.mp4`
- Create: `docs/CODE_REVIEW_REPORT_v1.md`

**Interfaces:**
- Produces exact platform copy, a <=90-second demo, an OKX.AI Agent ID, and final form evidence.

- [ ] **Step 1: Prepare exact listing copy**

Service type: A2MCP.

Category: Lifestyle.

Launch price: 0.

Endpoint: production `/api/v1/audit` URL.

Description must state the non-veterinary boundary and structured output.

- [ ] **Step 2: Register and request listing**

Follow the official Onchain OS identity preflight, explicit service-completion gate, confirmation card, identity create, and activate/listing workflow. Record the real Agent ID and review state; do not infer IDs.

- [ ] **Step 3: Produce the demo**

The video shows the deployed page, one `CLEAR` flow, one `CAUTION` flow, the JSON receipt, the live API, and the OKX.AI listing. Narration and subtitles must stay synchronized and the final duration must be <=90 seconds.

- [ ] **Step 4: Run mandatory reviews**

After every implementation batch, dispatch the installed code reviewer. Before release, request one TypeScript review, one security review, one E2E review, and the external `黑客松reviewer` submission review. Fix accepted findings and repeat until the verdict has no blocker or high issue.

- [ ] **Step 5: Publish the X participation post**

The post includes `#OKXAI`, the use case, the <=90-second demo, the live ASP identity, and the public repository. Treat posting as an external side effect and obtain action-time confirmation.

- [ ] **Step 6: Submit HackQuest and Google forms**

Use the literal fields from `ops/HACKQUEST_SUBMISSION.md`. Treat each final submission as an external side effect and obtain action-time confirmation. Save the success page URL and exact status.

- [ ] **Step 7: Final verification**

Verify the ASP is live, the X post is public, the video plays signed out, the HackQuest project renders its images, the Google form confirms receipt, and public claims match `proof.json`.

