# PawSift manual-review escalation

Prepared on 2026-07-18 for OKX Support.

## Request

Please manually review PawSift Agent `6036` and service `34579`. The second
listing rejection appears to apply the paid x402 validator to a free A2MCP
service and reports an endpoint timeout that cannot be reproduced publicly.

## Registered service

| Field | Value |
| --- | --- |
| Agent | PawSift (`6036`) |
| Service | PawSift Pet Fit Check (`34579`) |
| Type | A2MCP |
| Fee | `0 USDT` |
| Endpoint | `https://pawsift.vercel.app/api/v1/audit` |
| Current listing state | `Listing rejected` / `not listed` |

## Current public replay

Executed on 2026-07-18:

```bash
curl -i -X POST https://pawsift.vercel.app/api/v1/audit
```

Observed response:

```text
HTTP/2 200
content-type: application/json
cache-control: no-store
x-pawsift-ruleset: 2026.07.7
x-vercel-cache: MISS
x-vercel-id: sfo1::iad1::vcrtz-1784386033106-6bbbb9d142ee
```

The body was a normal deterministic `AuditResponse` with verdict `CLEAR`.

## Contract conflict

The registered fee is exactly `0 USDT`. The official A2MCP guide states that a
free service returns its result directly with HTTP 200 and does not use x402.
Its published self-check is the same zero-body POST shown above. The rejection
instead asks this free service to return an unpaid HTTP 402 challenge.

Official guide:
`https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp`

## Requested investigation

Please provide or confirm:

1. Why service `34579`, registered at `0 USDT`, was evaluated as a paid x402 service.
2. The exact method, URL, headers and body used by the listing validator.
3. The validator timestamp, source region/IP and timeout threshold.
4. Whether the validator can reach Vercel endpoints and follow the documented free-A2MCP flow.
5. A manual free-A2MCP review of Agent `6036` using the exact public endpoint above.

## Supporting links

- Source: `https://github.com/stetang98/pawsift`
- Earlier deployment evidence: `https://github.com/stetang98/pawsift/blob/main/ops/OKX_REREVIEW_EVIDENCE.md`
- Operator contact: Ste Tang, GitHub `stetang98`, X `@Stetang3438`

This escalation does not claim that the Agent is approved, listed or live in
the marketplace. It asks OKX to reconcile the current rejection with the
registered free-service configuration and the current public HTTP response.

## Submission record

Sent to `support@okx.com` from the account owner's private email on
2026-07-18 at 10:48 EDT.

- Subject: `Manual review request: free A2MCP Agent 6036 incorrectly rejected for x402`
- Gmail message ID: `[REDACTED_PRIVATE_METADATA]`
- Attachment: `OKX_SUPPORT_ESCALATION_2026-07-18.md`

The email address returned an automated notice that it is no longer used for
customer support. The escalation was therefore resubmitted through the official
OKX Wallet support-center form on 2026-07-18.

- Official ticket: `#36735890`
- Ticket email: `[REDACTED_PRIVATE_CONTACT]`
- Portal confirmation: `工单已提交`
- Status boundary: support review pending; Agent `6036` remains `Listing rejected` / `not listed`

On 2026-07-18, support agent Nazira requested a more detailed description.
The 4,534-character technical and competition-background response was sent in
the ticket portal. The portal then changed to `客服专员跟进中`.

Exact follow-up: [`OKX_SUPPORT_FOLLOWUP_36735890.md`](./OKX_SUPPORT_FOLLOWUP_36735890.md)

Later on 2026-07-18, Nabilla and Gio confirmed in the official ticket that the
case had been forwarded and escalated to the relevant team. Gio stated that
support would provide an update within 24 hours after receiving that team's
feedback. No further evidence was requested. This acknowledgement does not
change the marketplace boundary: Agent `6036` remains `Listing rejected` /
`not listed` pending an independently verified approval and public listing URL.
