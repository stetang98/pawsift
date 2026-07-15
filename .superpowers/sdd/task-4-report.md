# Task 4 Report

Status: DONE
Commit: recorded in the final task handoff response

## Scope

- Added `src/http/errors.ts`
- Added `app/api/v1/audit/route.ts`
- Added `app/api/v1/health/route.ts`
- Added `app/api/v1/examples/route.ts`
- Added `app/openapi.json/route.ts`
- Added `app/.well-known/pawsift.json/route.ts`
- Added `tests/routes/audit-route.test.ts`
- Added `tests/routes/metadata-routes.test.ts`

## Domain File Changes

- None. The existing domain schemas, rules, and fixtures were sufficient for the tested Task 4 contract, so no domain files were modified.

## TDD Evidence

1. Wrote `tests/routes/audit-route.test.ts` and `tests/routes/metadata-routes.test.ts` before adding route handlers.
2. Ran `npm test -- tests/routes` and confirmed the red step:
   - `Failed to resolve import "../../app/api/v1/audit/route"`
   - `Failed to resolve import "../../app/.well-known/pawsift.json/route"`
3. Implemented the HTTP handlers and shared response/error helpers.
4. Ran `npm test -- tests/routes tests/domain` and confirmed green.

## Contract Notes

- `POST /api/v1/audit` enforces `32768` bytes using raw body byte length before `JSON.parse`.
- Error semantics:
  - `400` for malformed JSON and schema violations
  - `413` for oversized payloads
  - `422` for explicit unsupported non-veterinary scope via PS-008 guidance
- All JSON responses include:
  - `cache-control: no-store`
  - `x-pawsift-ruleset: 2026.07.1`
  - permissive CORS headers
- `OPTIONS` is implemented for the public routes covered here.
- OpenAPI examples are derived from checked-in fixtures plus `auditProduct(...)`, not handwritten mock payloads.

## Verification Evidence

### Tests

Command:

```bash
npm test -- tests/routes tests/domain
```

Result:

```text
Test Files  6 passed (6)
Tests  55 passed (55)
```

### Lint

Command:

```bash
npm run lint
```

Result:

```text
exit 0
```

### Typecheck

Command:

```bash
npm run typecheck
```

Result:

```text
exit 0
```

### Build

Command:

```bash
npm run build
```

Result:

```text
Compiled successfully
Route (app)
/.well-known/pawsift.json
/api/v1/audit
/api/v1/examples
/api/v1/health
/openapi.json
```

## Self-Review

- Reviewed the new HTTP contract surface manually after the first green run.
- Corrected one OpenAPI drift: defaulted request arrays (`traits`, `materials`, `claims`) are not marked required in the published request schema.
- Confirmed the route layer does not read environment secrets.
- Confirmed the untracked `public/` assets were left untouched.

## Concerns

- None at handoff.

## Fix Wave

### Scope

- Fixed all three Task 4 Important findings across the owned Task 4 route/helper/test surfaces plus `app/openapi.json/route.ts`.
- Left the existing untracked `public/` assets untouched.
- Added one new helper file at `src/http/openapi.ts` to centralize the OpenAPI contract and keep route/runtime parity maintainable.

### Fix 1: Raw-byte streaming guard and early cancel

- Replaced decoded-string sizing in `app/api/v1/audit/route.ts` with `readRawRequestBody(...)` in `src/http/errors.ts`.
- The new reader:
  - consumes `request.body` as streamed `Uint8Array` chunks,
  - counts raw bytes before decoding,
  - calls `reader.cancel(...)` immediately once the total exceeds `32768`,
  - only UTF-8 decodes after the byte cap passes,
  - rejects invalid UTF-8 as the same sanitized `400 INVALID_JSON` surface instead of leaking decoder details.
- This closes the BOM hole where `Request.text()` normalization could shrink the decoded body below the limit after the raw wire payload already exceeded it.

### Fix 2: Public-route 405 contract

- Added explicit unsupported-method exports on every public route instead of relying on framework-generated bare `405` responses:
  - `app/api/v1/audit/route.ts`
  - `app/api/v1/health/route.ts`
  - `app/api/v1/examples/route.ts`
  - `app/openapi.json/route.ts`
  - `app/.well-known/pawsift.json/route.ts`
- Added shared `methodNotAllowedResponse(...)` and `unsupportedMethodHandler(...)` helpers in `src/http/errors.ts`.
- The new `405` responses now consistently include:
  - JSON body,
  - `cache-control: no-store`,
  - `x-pawsift-ruleset`,
  - public CORS headers,
  - `allow` with the route’s allowed methods.

### Fix 3: OpenAPI/runtime parity

- Moved the OpenAPI document into `src/http/openapi.ts` and rebuilt it from shared schemas where practical via local Zod 4 `toJSONSchema(...)`.
- The published document now:
  - derives `AuditRequest` and `AuditResponse` from shared Zod schemas,
  - derives exact metadata response schemas for health/examples/well-known/OpenAPI responses,
  - declares shared response headers centrally in `components.headers`,
  - declares `OPTIONS 204` operations on every public route,
  - declares sanitized `405` responses on public operations,
  - keeps fixture/report examples derived from checked-in fixtures plus `auditProduct(...)`,
  - documents runtime-only normalization and cross-field semantics with explicit extensions:
    - `x-pawsift-normalization: "trim"`
    - `x-pawsift-constraints: [{ kind: "min_lte_max", minField: "minWeightKg", maxField: "maxWeightKg" }]`
- This preserves the exact runtime behavior that JSON Schema alone cannot express, while still deriving the rest of the contract from the same Zod sources.

### Test Coverage Added

- `tests/routes/audit-route.test.ts`
  - exact `32768` byte request accepted past the size gate,
  - exact `32769` byte request rejected with `413`,
  - BOM-prefixed oversize request rejected by raw-byte counting,
  - invalid UTF-8 returns sanitized `400 INVALID_JSON`,
  - chunked oversize request cancels after the second chunk instead of draining the stream.
- `tests/routes/metadata-routes.test.ts`
  - explicit `OPTIONS` coverage for examples and OpenAPI routes,
  - sanitized `405` coverage for every public route,
  - OpenAPI parity checks for defaults, trim metadata, min/max constraint metadata, shared headers, and live metadata response-schema validation.

### Fresh Verification Evidence

#### Tests

Command:

```bash
npm test -- tests/routes tests/domain
```

Result:

```text
Test Files  6 passed (6)
Tests  73 passed (73)
```

#### Lint

Command:

```bash
npm run lint
```

Result:

```text
exit 0
```

#### Typecheck

Command:

```bash
npm run typecheck
```

Result:

```text
exit 0
```

#### Build

Command:

```bash
npm run build
```

Result:

```text
Compiled successfully
Route (app)
/.well-known/pawsift.json
/api/v1/audit
/api/v1/examples
/api/v1/health
/openapi.json
```

## Fix Wave 2

### Scope

- Split the audit 400 response contract away from the 413 payload-too-large contract in `src/http/openapi.ts`.
- Added an exact regression test in `tests/routes/metadata-routes.test.ts` to pin `INVALID_JSON` + `INVALID_REQUEST` to 400 and `PAYLOAD_TOO_LARGE` to 413.
- Left the untracked `public/` assets untouched.

### Verification

Command:

```bash
npm test -- tests/routes/metadata-routes.test.ts tests/routes/audit-route.test.ts
```

Result:

```text
Test Files  2 passed (2)
Tests       32 passed (32)
```

Command:

```bash
npm run lint
```

Result:

```text
exit 0
```

Command:

```bash
npm run typecheck
```

Result:

```text
exit 0
```

Command:

```bash
git diff --check
```

Result:

```text
exit 0
```

#### Whitespace / patch hygiene

Command:

```bash
git diff --check
```

Result:

```text
exit 0
```

### Remaining Concerns

- None. The implemented fix wave matches the requested conservative approach.
