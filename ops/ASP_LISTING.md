# PawSift OKX.AI ASP listing

Status: Agent ID `6036` created; approval submitted; listing is under review.

## Listing fields

| Field | Exact value |
| --- | --- |
| ASP name | `PawSift` |
| Role | `asp` |
| Category | `Lifestyle` |
| Service name | `PawSift Product Audit` |
| Service type | `A2MCP` |
| Launch fee | `0` USDT |
| Endpoint | `https://pawsift.vercel.app/api/v1/audit` |
| Avatar | `https://static.okx.com/cdn/web3/wallet/marketplace/headimages/agent/avatar/90713ec2-b8e9-49e2-8a6c-f1d2cf0dcf44.png` |
| Preferred review language | `en-US` |
| Agent ID | `6036` |
| Listing state | `Listing under review` |
| Registration transaction | `0x25e7dd9f7ca75cd30eaa40fd074a89860442eadfd067d0715a4e08aa4d3869be` |

## ASP description

PawSift is a deterministic fit and listing-quality auditor for non-ingestible cat and dog supplies. Submit objective pet and product facts to receive a CLEAR, CAUTION, BLOCK, or HUMAN_REVIEW verdict, rule-level evidence, missing facts, seller-copy patches, and reproducible SHA-256 receipts. PawSift is not veterinary advice and does not evaluate food, medication, pesticides, symptoms, or medical suitability.

## Service description

Audit a non-ingestible cat or dog product listing against objective species, fit, materials, detachable-part, battery, magnet, care, and claim rules. Returns a structured verdict, score, findings, missing facts, owner questions, listing patches, safety boundary, ruleset version, and SHA-256 input/report receipt. Unsupported medical or ingestible claims route to HUMAN_REVIEW.

## Service JSON

OnchainOS CLI `4.2.4` documents `fee` as a number, but its runtime parser rejected numeric `0` with `expected a string`; the successful registration used the string value `"0"`. The service API subsequently reports the normalized fee as `"0"` / `0 USDT`.

```json
[
  {
    "serviceName": "PawSift Product Audit",
    "serviceDescription": "Audit a non-ingestible cat or dog product listing against objective fit and disclosure rules. Returns a structured verdict, evidence, missing facts, listing patches, and reproducible SHA-256 receipts. Unsupported medical or ingestible claims route to HUMAN_REVIEW.",
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
  --description "PawSift is a deterministic fit and listing-quality auditor for non-ingestible cat and dog supplies. Submit objective pet and product facts to receive a CLEAR, CAUTION, BLOCK, or HUMAN_REVIEW verdict, rule-level evidence, missing facts, seller-copy patches, and reproducible SHA-256 receipts. PawSift is not veterinary advice and does not evaluate food, medication, pesticides, symptoms, or medical suitability." \
  --picture "[CDN_AVATAR_URL]" \
  --service '[{"serviceName":"PawSift Product Audit","serviceDescription":"Audit a non-ingestible cat or dog product listing against objective fit and disclosure rules. Returns a structured verdict, evidence, missing facts, listing patches, and reproducible SHA-256 receipts. Unsupported medical or ingestible claims route to HUMAN_REVIEW.","serviceType":"A2MCP","fee":"0","endpoint":"https://pawsift.vercel.app/api/v1/audit"}]'
```

6. Record the returned real Agent ID, select Done rather than adding another service, then run the listing validation exactly once before activation. The completed registration returned Agent ID `6036` and transaction hash `0x25e7dd9f7ca75cd30eaa40fd074a89860442eadfd067d0715a4e08aa4d3869be`.

7. Activate the real Agent ID and preserve the backend review status.

```bash
/Users/stetang/.local/bin/onchainos agent activate \
  --agent-id "6036" \
  --preferred-language en-US
```

The approval submission succeeded on 2026-07-15. The current profile response reports `approvalLabel: Listing under review` and `statusLabel: not listed`. Do not describe PawSift as approved or publicly listed until that state changes.

## Required evidence

- Real Agent ID `6036` returned by the CLI.
- `agent profile` output for that ID.
- `agent service-list` output showing one free A2MCP service and the production endpoint.
- Activation/review response showing `Listing under review`.
- Public OKX.AI listing URL after approval.
- Signed-out endpoint replay matching the checked-in clear fixture receipt.
