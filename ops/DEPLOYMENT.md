# Production deployment evidence

Verification timestamp: `2026-07-16T07:07:12Z`.

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
| `GET /api/v1/health` | HTTP 200, `status=ok`, ruleset `2026.07.7` |
| `GET /api/v1/examples` | HTTP 200, 12 fixtures |
| `GET /openapi.json` | HTTP 200, OpenAPI 3.1.0, POST and OPTIONS audit operations |
| `GET /.well-known/pawsift.json` | HTTP 200, A2MCP discovery metadata |
| Valid clear fixture | HTTP 200, `CLEAR`, rule `PS-010` |
| Medical wording in product name | HTTP 422, `HUMAN_REVIEW`, rule `PS-008`, field-labeled evidence |
| `Freeze-Dried Food` product name | HTTP 422, `HUMAN_REVIEW`, rule `PS-008`, `product.name` evidence |
| `Freeze-Dried Food Bowl` product name | HTTP 422, `HUMAN_REVIEW`; ingestible qualifier cannot hide behind accessory suffix |
| `Single-Ingredient Treat Pouch` product name | HTTP 422, `HUMAN_REVIEW`; ingestible qualifier cannot hide behind accessory suffix |
| Joined/underscored accessory wording such as `FoodBowl`, `Food_Bowl`, and `TreatPouch` | HTTP 422, `HUMAN_REVIEW` when the preceding qualifier is ingestible or unknown |
| Zero-width/format-control obfuscation in food or medical wording | HTTP 422, `HUMAN_REVIEW`, with a bounded visible `normalized=...` evidence preview |
| Plural food/treat accessory names | HTTP 200, `CLEAR`, explicit non-ingestible accessory exceptions preserved |
| Benign split words such as `Health\u200Dy` and `Stain\u200Bless` | HTTP 200, `CLEAR`; normalization does not create broad substring false positives |
| Collar without supported weight range | HTTP 200, `CAUTION`, rule `PS-011` |
| Invalid schema request | HTTP 400 |
| 32769-byte body | HTTP 413 |

The health response includes `cache-control: no-store`, permissive read-only CORS headers, HSTS, and `x-pawsift-ruleset: 2026.07.7`.

## Hosted receipt match

The hosted clear fixture returned:

```text
inputHash  f8ab57435e1fb63b7fda95d06437c263ef87e1c63051e723e39ee56797eff5ff
reportHash c35e0036153fbc634d99d2e780fd7036ee18fade3a26d3ef72c25ced67c32011
```

Both values match `clear-cat-collar` in `proof/proof.json`.

The hosted missing-weight collar fixture returned HTTP 200 with `CAUTION` / `PS-011` and receipt hashes `cf319400e293e7a0364560d2e8665be032754aa928855e5689c103acc6b3f746` (input) and `ba61f77a812174c7f74c69021f35b5db4726d782cd796a488ad2ca511d651c94` (report).

## Reproducible proof binding

`proof/config.json` pins the audited source commit and this verified deployment record. The proof exporter reads no deployment or commit environment variables. It verifies every proof-critical working file against the pinned commit, records that commit's Git blob identifiers and SHA-256 digests, and refuses to export when any source differs.

The `live` state is accepted only for the stable PawSift production origin, the health contract above, the hosted `clear-cat-collar` receipt, and the SHA-256 digest of this deployment record. Run `npm run proof` twice and compare `proof/proof.json` to verify deterministic regeneration.

## Browser QA

- The checked-in Playwright suite exercises desktop, 320 px, and 390 px layouts, keyboard operation, stable control dimensions, and core audit states.
- Release-specific production captures are regenerated after proof pinning for the submission package and demo video; they are not used as proof-critical source provenance.

## Honest launch state

- Payment mode: `free_launch`.
- Observed sales: 0.
- Sales/payment transaction hashes: none. The separate identity-registration transaction is documented in `ops/OKX_REGISTRATION_EVIDENCE.md`.
- OKX.AI identity and ASP approval are separate external steps and are not asserted by this deployment record.
