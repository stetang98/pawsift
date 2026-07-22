# PawSift OKX.AI ASP listing

Status: Agent ID `6036` is `active` and officially `Listed — eligible for task recommendations`; public agent search returns PawSift and Service `34579`.

## Listing fields

| Field | Exact value |
| --- | --- |
| ASP name | `PawSift` |
| Role | `asp` |
| Category | `Lifestyle` |
| Service name | `PawSift Pet Fit Check` |
| Service type | `A2MCP` |
| Launch fee | `0` USDT |
| Endpoint | `https://pawsift.vercel.app/api/v1/audit` |
| Avatar | `https://static.okx.com/cdn/web3/wallet/marketplace/headimages/agent/avatar/90713ec2-b8e9-49e2-8a6c-f1d2cf0dcf44.png` |
| Preferred review language | `en-US` |
| Agent ID | `6036` |
| Listing state | `Listed — eligible for task recommendations`; `active` |
| Verified marketplace category | `LIFESTYLE` |
| Registration transaction | `0x25e7dd9f7ca75cd30eaa40fd074a89860442eadfd067d0715a4e08aa4d3869be` |
| Lifestyle profile update transaction | `0x2d290ec5e689fbf463397446020e290a98c0320d184133e349f22cbbefcaaf1a` |

## ASP description

PawSift is a pet lifestyle shopping companion for cat and dog owners choosing non-ingestible everyday supplies. It checks objective fit, supported weight, materials, detachable parts, batteries, magnets, care and listing completeness, then returns a clear shopping verdict, questions to ask the seller and safer listing corrections. It does not provide veterinary advice or evaluate food, medication, pesticides, symptoms or medical suitability.

## Service description

Help cat and dog owners choose suitable non-ingestible everyday pet supplies. Check objective pet and product facts for fit, supported weight and listing completeness, then return a structured verdict, missing facts, seller questions, corrections and reproducible receipts. Medical or ingestible requests route to human review.

## Service JSON

OnchainOS CLI `4.2.4` documents `fee` as a number, but its runtime parser rejected numeric `0` with `expected a string`; the successful registration used the string value `"0"`. The service API subsequently reports the normalized fee as `"0"` / `0 USDT`.

```json
[
  {
    "serviceName": "PawSift Pet Fit Check",
    "serviceDescription": "Help cat and dog owners choose suitable non-ingestible everyday pet supplies. Check objective pet and product facts for fit, supported weight and listing completeness, then return a structured verdict, missing facts, seller questions, corrections and reproducible receipts. Medical or ingestible requests route to human review.",
    "serviceType": "A2MCP",
    "fee": "0",
    "endpoint": "https://pawsift.vercel.app/api/v1/audit"
  }
]
```

## Official CLI sequence

Run from the repository root with `/Users/stetang/.local/bin/onchainos` version `4.2.4` or newer.

1. Run session preflight and inspect the JSON result.

```bash
/Users/stetang/.local/bin/onchainos preflight
```

2. Run the ASP pre-check. If terms and a `consentKey` are returned, display the complete terms and obtain explicit owner acceptance before rerunning with `--consent-key`.

```bash
/Users/stetang/.local/bin/onchainos agent pre-check --role asp
```

3. Upload the committed square avatar and preserve the returned CDN URL.

```bash
/Users/stetang/.local/bin/onchainos agent upload \
  --file /Users/stetang/Desktop/黑客松/pawsift/public/brand/pawsift-mark-512-v2.png
```

4. Present the exact name, role, description, avatar URL, and single service above in the official confirmation gate. Do not run `agent create` until that gate is explicitly accepted.

5. After acceptance, create exactly one ASP identity with one service. Replace only `[CDN_AVATAR_URL]`.

```bash
/Users/stetang/.local/bin/onchainos agent create \
  --role asp \
  --name "PawSift" \
  --description "PawSift is a pet lifestyle shopping companion for cat and dog owners choosing non-ingestible everyday supplies. It checks objective fit, supported weight, materials, detachable parts, batteries, magnets, care and listing completeness, then returns a clear shopping verdict, questions to ask the seller and safer listing corrections. It does not provide veterinary advice or evaluate food, medication, pesticides, symptoms or medical suitability." \
  --picture "[CDN_AVATAR_URL]" \
  --service '[{"serviceName":"PawSift Pet Fit Check","serviceDescription":"Help cat and dog owners choose suitable non-ingestible everyday pet supplies. Check objective pet and product facts for fit, supported weight and listing completeness, then return a structured verdict, missing facts, seller questions, corrections and reproducible receipts. Medical or ingestible requests route to human review.","serviceType":"A2MCP","fee":"0","endpoint":"https://pawsift.vercel.app/api/v1/audit"}]'
```

6. Record the returned real Agent ID, select Done rather than adding another service, then run the listing validation exactly once before activation. The completed registration returned Agent ID `6036` and transaction hash `0x25e7dd9f7ca75cd30eaa40fd074a89860442eadfd067d0715a4e08aa4d3869be`.

7. Activate the real Agent ID and preserve the backend review status.

```bash
/Users/stetang/.local/bin/onchainos agent activate \
  --agent-id "6036" \
  --preferred-language en-US
```

The approval submission succeeded on 2026-07-15. On 2026-07-16, the profile and service descriptions were updated to the exact pet-lifestyle wording above. On 2026-07-17, OKX rejected the first review because its zero-byte endpoint probe received a non-200 response, followed by generic x402 and timeout failures. The registered service remained free at `0 USDT`; OKX's A2MCP guide explicitly says free endpoints return HTTP 200 directly and require no x402. After deployment and public replay, the service was updated in transaction `0xd954678b16a879bb5200b2aac1a6df0c0454b057c1b413e890262424e20b7f11` and resubmitted. At that dated stage the profile reported `Listing under review` and `not listed`.

On 2026-07-22, independent official CLI checks closed that historical review state: Agent `6036` is `active`, the approval label is `Listed — eligible for task recommendations`, Service `34579` remains the single free A2MCP service, and public agent search returns PawSift. See `ops/OKX_LISTING_APPROVAL_EVIDENCE_v1.md`.

## Required evidence

- Real Agent ID `6036` returned by the CLI.
- `agent profile` output for that ID.
- `agent service-list` output showing one free A2MCP service and the production endpoint.
- Current profile output showing the exact approval label and listing status.
- Public official CLI search evidence for the listed agent and service; capture a browser detail URL only if a form specifically requires one.
- Signed-out endpoint replay matching the checked-in clear fixture receipt.
