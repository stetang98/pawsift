# OKX support follow-up for ticket 36735890

Sent through the official OKX Wallet support portal on 2026-07-18.

## Submission state

- Ticket: `#36735890`
- Contact: `[REDACTED_PRIVATE_CONTACT]`
- Support agent: Nazira
- Support request: provide a more detailed description of the issue
- Reply length: 4,534 of 5,000 characters
- Portal status after sending: `客服专员跟进中`
- Marketplace boundary: Agent `6036` remains `Listing rejected` / `not listed`

## Support escalation status

The ticket received the following support updates on 2026-07-18:

- At 14:31, Nabilla confirmed that the case had been forwarded to the relevant
  team for further review.
- At 17:14, Gio confirmed that the case had been recorded and escalated to the
  relevant team. Support said it would provide an update within 24 hours after
  receiving feedback from that team.
- The portal remains `客服专员跟进中`. No additional evidence or code change
  has been requested.

This is an escalation acknowledgement, not OKX.AI approval. Agent `6036`
remains `Listing rejected` / `not listed` until the marketplace status and a
public listing URL independently confirm otherwise.

## Technical-team response and 2026-07-21 replay

On 2026-07-20 at 04:20, James relayed the technical team's designated-task
test. The team reported that Agent `6036` did not apply to its test task within
approximately 12 minutes, that the negotiate cache remained empty, and that
the profile exposed an empty `serviceList`. It again requested an x402 endpoint
and a standard HTTP 402 challenge.

The official CLI was replayed on 2026-07-21. It exposed two platform-level
contract conflicts:

- `agent profile 6036` reports `Listing rejected`, `not listed`, and an empty
  embedded `serviceList`, while `agent service-list --agent-id 6036` returns
  exactly one real service: ID `34579`, type `A2MCP`, fee `0 USDT`, endpoint
  `https://pawsift.vercel.app/api/v1/audit`.
- `agent gate-check --role asp` reports wallet, identity, and A2A communication
  ready for Agent `6036`.
- `agent active-tasks --role asp --include-terminal` exposes the designated
  test task `0x5eabe69424c5cfde8c8e3b9ca5ead51de24d4d5250537204558b48e3de40799f`
  (`Cat Harness Fit Check`) in `created` state, with PawSift as provider and a
  budget of `0 USDT`.
- The official `agent apply` command requires `--token-amount` to be greater
  than zero and explicitly rejects a zero-value free apply as irreversible.
  PawSift therefore cannot apply to this zero-USDT designated task through the
  documented CLI path.
- A fresh exact zero-byte POST to the registered endpoint returned HTTP 200 in
  `1.691407s`, with `x-pawsift-ruleset: 2026.07.7`, a normal `CLEAR` response,
  and Vercel trace `sfo1::iad1::mmmdb-1784625351468-36e7980a26fb`.

These observations do not establish listing approval. They show that the
current designated test combines a free service and zero-value task with a
paid x402/apply flow that the official CLI cannot complete.

### Exact 2026-07-21 reply

Submitted through the official ticket portal on 2026-07-21 at 05:18. The
message appears in the ticket timeline under `您`, the composer cleared, and
ticket `#36735890` returned to `客服专员跟进中`.

At 07:05 on 2026-07-21, James confirmed that the case had been escalated to
the relevant team for further review and stated that an update would be
provided within 24-48 hours. This is an escalation acknowledgement, not a
listing approval or rejection. No new implementation change or evidence was
requested in that message.

Dear James,

Thank you for the technical details. I reproduced the designated-task state
today with the official OnchainOS CLI, and the replay exposes two platform
contract conflicts that prevent PawSift from performing the requested action.

1. `agent profile 6036` reports `Listing rejected`, `not listed`, and an empty
`serviceList`, but `agent service-list --agent-id 6036` returns one registered
service: Service 34579, A2MCP, fee 0 USDT, endpoint
https://pawsift.vercel.app/api/v1/audit.

2. `agent gate-check --role asp` reports `ready: true`, with wallet, Agent 6036
identity, and A2A communication all ready. The profile also reports the Agent
online.

3. `agent active-tasks --role asp --include-terminal` exposes the technical
team's designated task as job
`0x5eabe69424c5cfde8c8e3b9ca5ead51de24d4d5250537204558b48e3de40799f`,
title `Cat Harness Fit Check`, status `created`, user Agent 1757, provider Agent
6036, payment mode 3, and token amount 0 USDT.

4. The official `agent apply` command requires `--token-amount` to be greater
than zero and explicitly rejects a zero-value free apply as irreversible.
Therefore PawSift cannot apply to this 0 USDT designated task through the
official CLI. The x402 pay/direct-accept flow is likewise incompatible with a
service registered as free at 0 USDT.

5. The registered endpoint is currently reachable. A fresh exact replay of
`curl -i -X POST https://pawsift.vercel.app/api/v1/audit` returned HTTP 200 in
1.691407 seconds, `x-pawsift-ruleset: 2026.07.7`, and a normal deterministic
`CLEAR` response. Vercel trace:
`sfo1::iad1::mmmdb-1784625351468-36e7980a26fb`.

Please keep this ticket open and escalate these exact findings to the OKX.AI /
OnchainOS engineering team. Please ask them to:

1. reconcile the empty `profile.serviceList` with `service-list` returning
Service 34579;
2. route this registered 0 USDT A2MCP service through the documented free
HTTP 200 path, or provide the official documented command/API for accepting a
zero-USDT designated task;
3. reset or reissue the test task after correcting its payment/review mode;
4. rerun the listing review against the current endpoint.

We are ready to retest immediately, but adding a paid HTTP 402 challenge or
submitting a positive token amount would contradict the registered 0 USDT
service configuration. Thank you for forwarding this to the engineering team.

## Exact reply

Dear Nazira,

Thank you for following up. Below is the full background and the exact issue.

### 1. Competition and registration context

PawSift is an ASP built for the OKX AI Genesis Hackathon hosted on HackQuest. The event requires the ASP to pass OKX.AI internal listing review and become publicly listed. We registered it through OnchainOS and are not claiming that it is currently approved or live.

### 2. Registered identifiers and service

- Agent name: PawSift
- Agent ID: 6036
- Role/category: ASP / LIFESTYLE
- Service name: PawSift Pet Fit Check
- Service ID: 34579
- Service type: A2MCP
- Registered fee: 0 USDT
- Endpoint: https://pawsift.vercel.app/api/v1/audit
- Current state: Listing rejected / not listed

PawSift is a deterministic, non-veterinary product-fit checker for ordinary non-ingestible cat and dog supplies. It checks supplied facts such as supported weight, dimensions, materials, detachable parts and listing completeness, then returns a structured verdict and reproducible SHA-256 receipt. Medical, pesticide, food and other unsupported requests are routed away from automatic approval.

### 3. Review history

The first listing review was rejected with three reasons: the endpoint could not be reached, x402 validation failed, and the platform received no response before timeout. We then reviewed the official A2MCP documentation and changed the production route to support the exact free-service availability probe. Only a true zero-byte POST receives the deterministic audit fixture; all non-empty requests still undergo strict JSON and schema validation. The fix was tested, reviewed, deployed and resubmitted.

The second listing review returned the same three rejection reasons word-for-word, including a requirement to return a paid HTTP 402 challenge.

### 4. Why the rejection appears inconsistent

Service 34579 is registered at exactly 0 USDT. The official OKX A2MCP guide states that a free service returns its result directly with HTTP 200 and does not use x402. It gives this self-check:

`curl -i -X POST https://your-domain/path`

Expected behavior in the guide:

- Free service: HTTP 200, no x402
- Paid service: HTTP 402 challenge

Official guide:
https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp

Therefore, asking this 0 USDT service to return HTTP 402 appears to apply the paid-service validator to a free A2MCP registration.

### 5. Current public evidence

The exact production replay was repeated after the second rejection:

`curl -i -X POST https://pawsift.vercel.app/api/v1/audit`

Observed result:

- HTTP/2 200
- content-type: application/json
- cache-control: no-store
- x-pawsift-ruleset: 2026.07.7
- valid deterministic AuditResponse with verdict CLEAR
- no authentication, API key or wallet signature required
- Vercel request path: /api/v1/audit
- representative Vercel trace: sfo1::iad1::vcrtz-1784386033106-6bbbb9d142ee

A malformed non-empty JSON request still returns HTTP 400 INVALID_JSON, proving the compatibility branch is limited to the documented zero-byte availability probe.

The official OnchainOS service-list command also confirms Service 34579 uses the same endpoint and fee 0 USDT.

### 6. Engineering and evidence

- Public source: https://github.com/stetang98/pawsift
- Production: https://pawsift.vercel.app
- Endpoint: https://pawsift.vercel.app/api/v1/audit
- Deployment/re-review evidence: https://github.com/stetang98/pawsift/blob/main/ops/OKX_REREVIEW_EVIDENCE.md
- Remediation source commit: 16778a81951227069eef3f778e11fa0dd25e98a3
- Ruleset: 2026.07.7

The implementation and documentation were independently reviewed. Tests cover the zero-byte 200 response, malformed JSON 400 response, strict normal requests, OpenAPI behavior and security boundaries.

### 7. Requested action

Please escalate this ticket to the OKX.AI / OnchainOS listing technical team and:

1. manually test Agent 6036 as a free A2MCP service using the exact POST above;
2. confirm why a 0 USDT service was evaluated by the x402 paid validator;
3. provide the validator's exact HTTP method, URL, headers, body, timestamp, source region/IP and timeout threshold;
4. confirm whether the validator can reach Vercel-hosted endpoints;
5. re-open the listing review after the free-service configuration is verified.

We are ready to make a code change if a documented request contract is missing, but we need the actual failing request or validator trace. Adding x402 to a registered free service would contradict the current official guide.

Thank you for forwarding this to the appropriate technical team.
