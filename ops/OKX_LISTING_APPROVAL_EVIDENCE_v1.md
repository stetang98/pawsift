# PawSift OKX.AI listing approval evidence v1

Observed on 2026-07-22 through the official `onchainos` CLI.

## Current status

| Field | Verified value |
| --- | --- |
| Agent | PawSift (`6036`) |
| Role | `ASP` |
| Category | `LIFESTYLE` |
| Agent status | `active` |
| Approval status | `Listed — eligible for task recommendations` |
| Online status | `1` |
| Service | PawSift Pet Fit Check (`34579`) |
| Service type | `A2MCP` |
| Fee | `0 USDT` |
| Endpoint | `https://pawsift.vercel.app/api/v1/audit` |

## Independent public-search check

The following command returned exactly one public result, Agent `6036`, with
one service, Service `34579`:

```bash
onchainos agent search --query PawSift --page 1 --page-size 20
```

The result reported `status: 1`, category `Lifestyle`, minimum price `0.0`,
and the production endpoint above. This closes the prior external listing
gate. Historical rejection and support-escalation records remain valid as
dated history, but they no longer describe the current marketplace state.

## Profile check

```bash
onchainos agent profile 6036
onchainos agent service-list --agent-id 6036
```

The profile returned approval display status `4` and approval label
`Listed — eligible for task recommendations`. The service-list command
returned Service `34579` with its registered free A2MCP configuration.

## Remaining publication work

Any submission copy or video frame that still says `Listing rejected`,
`Listing under review`, or `not listed` is stale and must be replaced before
final judging. A browser-facing marketplace detail URL still needs to be
captured separately if the submission form requires a clickable listing URL.
