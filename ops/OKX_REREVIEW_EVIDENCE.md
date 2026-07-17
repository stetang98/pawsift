# PawSift OKX.AI re-review evidence

Verified from the public production alias on 2026-07-17 after deploying commit `16778a8`.

## Deployment

| Field | Verified value |
| --- | --- |
| Source commit | `16778a81951227069eef3f778e11fa0dd25e98a3` |
| Production alias | `https://pawsift.vercel.app` |
| Vercel deployment | `dpl_2SMryGpC7kK27V4SpMis3QixZ69e` |
| Deployment URL | `https://pawsift-lrbqpi6lm-stetang-s-projects.vercel.app` |
| Vercel status | `Ready` |
| Created | `2026-07-17 07:47:22 EDT` |

## Free A2MCP availability probe

The registered service has fee `0 USDT`. OKX's A2MCP guide states that a free endpoint returns the result directly with HTTP 200 and does not use x402.

Exact replay:

```bash
curl -i -X POST https://pawsift.vercel.app/api/v1/audit
```

Observed result:

```text
HTTP/2 200
content-type: application/json
cache-control: no-store
x-pawsift-ruleset: 2026.07.7
```

The response was a normal deterministic `AuditResponse` with verdict `CLEAR`, ruleset `2026.07.7`, input hash `f8ab57435e1fb63b7fda95d06437c263ef87e1c63051e723e39ee56797eff5ff`, and report hash `c35e0036153fbc634d99d2e780fd7036ee18fade3a26d3ef72c25ced67c32011`.

Observed timing: connect `0.003019s`, first byte `1.213741s`, total `1.214451s`.

Captured body SHA-256: `c315849b4bb84090195416be5ad62c65c11f3bde16224bb6909075aa3086b784`.

## Negative replay

Malformed non-empty JSON remains rejected:

```bash
curl -i -X POST https://pawsift.vercel.app/api/v1/audit \
  -H 'content-type: application/json' \
  --data '{"pet":'
```

Observed result:

```text
HTTP/2 400
content-type: application/json
x-pawsift-ruleset: 2026.07.7

{"error":{"code":"INVALID_JSON","message":"Request body must be valid JSON."}}
```

Observed timing: connect `0.003283s`, first byte `1.132233s`, total `1.133549s`.

Captured body SHA-256: `8255b26db66a41a6fcce173bdc49eb2ba0eecdc63e64e8b6daf02bf7281a7d34`.

## Machine contract

The deployed OpenAPI operation reports `requestBody.required: false` and documents that only a zero-byte availability probe receives the deterministic example. Every non-empty body remains subject to strict JSON and request-schema validation.

## Status boundary

The service update succeeded in transaction `0xd954678b16a879bb5200b2aac1a6df0c0454b057c1b413e890262424e20b7f11`. The subsequent approval submission returned success, and an immediate official profile check reported `Listing under review` / `not listed`.

These checks prove deployment, endpoint behavior, and successful resubmission only. This document does not claim approval or a public marketplace listing.
