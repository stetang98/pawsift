# PawSift OKX.AI registration evidence

Observed through the official `onchainos` CLI on 2026-07-15, refreshed after the Lifestyle profile update on 2026-07-16, reconciled with the first review result on 2026-07-17, and updated after verified listing approval on 2026-07-22.

## Identity

| Field | Observed value |
| --- | --- |
| Agent ID | `6036` |
| Name | `PawSift` |
| Role | `ASP` |
| Chain index | `196` |
| Owner address | `0x37c8a0097b68a11e2165262b0a5f0ed724ff53f2` |
| Registration transaction | `0x25e7dd9f7ca75cd30eaa40fd074a89860442eadfd067d0715a4e08aa4d3869be` |
| Approval label | `Listed — eligible for task recommendations` |
| Listing status | `active`; returned by public agent search |
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

The identity, registration transaction, Lifestyle profile update, and initial rejection history are real. The remediation is deployed and publicly replayed in `ops/OKX_REREVIEW_EVIDENCE.md`. On 2026-07-22, the official profile changed to `Listed — eligible for task recommendations` / `active`, and `onchainos agent search --query PawSift` returned Agent `6036` with Service `34579`. See `ops/OKX_LISTING_APPROVAL_EVIDENCE_v1.md`. Historical rejection documents remain dated evidence and must not be read as the current state.
