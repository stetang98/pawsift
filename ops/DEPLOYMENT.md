# Production deployment evidence

Verification timestamp: pinned in `proof/config.json` after the hosted checks below complete.

## Public surfaces

- Repository: `https://github.com/stetang98/pawsift`
- Production console: `https://pawsift.vercel.app`
- Audit endpoint: `https://pawsift.vercel.app/api/v1/audit`
- Health: `https://pawsift.vercel.app/api/v1/health`
- Examples: `https://pawsift.vercel.app/api/v1/examples`
- OpenAPI: `https://pawsift.vercel.app/openapi.json`
- Metadata: `https://pawsift.vercel.app/.well-known/pawsift.json`

The proof validator accepts only the stable production origin above. `proof/config.json` pins the audited source commit containing this record, and `proof/proof.json` binds this file's SHA-256 digest. No historical Vercel deployment ID is presented as current-source evidence.

## Contract checks

| Check | Result |
| --- | --- |
| `GET /api/v1/health` | HTTP 200, `status=ok`, ruleset `2026.07.2` |
| `GET /api/v1/examples` | HTTP 200, 11 fixtures |
| `GET /openapi.json` | HTTP 200, OpenAPI 3.1.0, POST and OPTIONS audit operations |
| `GET /.well-known/pawsift.json` | HTTP 200, A2MCP discovery metadata |
| Valid clear fixture | HTTP 200, `CLEAR`, rule `PS-010` |
| Medical wording in product name | HTTP 422, `HUMAN_REVIEW`, rule `PS-008`, field-labeled evidence |
| Collar without supported weight range | HTTP 200, `CAUTION`, rule `PS-011` |
| Invalid schema request | HTTP 400 |
| 32769-byte body | HTTP 413 |

The health response includes `cache-control: no-store`, permissive read-only CORS headers, HSTS, and `x-pawsift-ruleset: 2026.07.2`.

## Hosted receipt match

The hosted clear fixture returned:

```text
inputHash  f8ab57435e1fb63b7fda95d06437c263ef87e1c63051e723e39ee56797eff5ff
reportHash f5bd2cbcb24b55469243c036ef20a7bedb0bd085d4af5435dbecda6cf69a97e2
```

Both values match `clear-cat-collar` in `proof/proof.json`.

## Reproducible proof binding

`proof/config.json` pins the audited source commit and this verified deployment record. The proof exporter reads no deployment or commit environment variables. It verifies every proof-critical working file against the pinned commit, records that commit's Git blob identifiers and SHA-256 digests, and refuses to export when any source differs.

The `live` state is accepted only for the stable PawSift production origin, the health contract above, the hosted `clear-cat-collar` receipt, and the SHA-256 digest of this deployment record. Run `npm run proof` twice and compare `proof/proof.json` to verify deterministic regeneration.

## Browser QA

- Desktop production flow was rerun against the deployment above at 1440 x 1024 with the `CLEAR` result, PS-010 evidence, and canonical receipt visible.
- Mobile production flow passed at 390 x 844 with the `CLEAR` result visible.
- One rendered brand image was present in both views.
- Browser diagnostic logs were empty in both views.
- Evidence: `artifacts/production/pawsift-production-desktop-v1.png` and `artifacts/production/pawsift-production-mobile-v1.png`.

## Honest launch state

- Payment mode: `free_launch`.
- Observed sales: 0.
- Sales/payment transaction hashes: none. The separate identity-registration transaction is documented in `ops/OKX_REGISTRATION_EVIDENCE.md`.
- OKX.AI identity and ASP approval are separate external steps and are not asserted by this deployment record.
