# PawSift OKX.AI registration evidence

Observed through the official `onchainos` CLI on 2026-07-15, refreshed after the Lifestyle profile update on 2026-07-16, and reconciled with the first review result on 2026-07-17.

## Identity

| Field | Observed value |
| --- | --- |
| Agent ID | `6036` |
| Name | `PawSift` |
| Role | `ASP` |
| Chain index | `196` |
| Owner address | `0x37c8a0097b68a11e2165262b0a5f0ed724ff53f2` |
| Registration transaction | `0x25e7dd9f7ca75cd30eaa40fd074a89860442eadfd067d0715a4e08aa4d3869be` |
| Approval label | `Listing under review` after remediation resubmission |
| Listing status | `not listed` |
| Marketplace category | `LIFESTYLE` |
| Profile update transaction | `0x2d290ec5e689fbf463397446020e290a98c0320d184133e349f22cbbefcaaf1a` |

## Service

Exactly one service is attached to Agent ID `6036`:

| Field | Observed value |
| --- | --- |
| Service name | `PawSift Pet Fit Check` |
| Service type | `A2MCP` |
| Fee | `0 USDT` |
| Endpoint | `https://pawsift.vercel.app/api/v1/audit` |
| Service record ID | `34579` |

## Honest status boundary

The identity, registration transaction, and Lifestyle profile update are real. The official profile classifies PawSift as `LIFESTYLE`, but OKX rejected the first listing review on 2026-07-17. The rejection reported an unreachable endpoint, failed x402 validation, and a timed-out invocation. The root availability mismatch was reproducible: OKX's documented zero-byte free-service probe returned HTTP 400, while the official A2MCP guide requires HTTP 200 and states that a free endpoint does not use x402. The remediation is deployed and publicly replayed in `ops/OKX_REREVIEW_EVIDENCE.md`. Service update transaction `0xd954678b16a879bb5200b2aac1a6df0c0454b057c1b413e890262424e20b7f11` succeeded, the approval resubmission succeeded, and the profile now reports `Listing under review` / `not listed`. PawSift must not be described as approved, listed, or live on the OKX.AI marketplace until re-review succeeds and a public listing URL is verified.
