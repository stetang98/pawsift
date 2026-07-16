# PawSift OKX.AI ASP listing

Status: prepared; identity creation and activation require the official confirmation gates.

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
| Avatar | `public/brand/pawsift-mark-512-v2.png` |
| Preferred review language | `en-US` |
| Agent ID | `[PENDING_REAL_OKX_AGENT_ID]` |
| Listing state | `[PENDING_OKX_REVIEW]` |

## ASP description

PawSift is a deterministic fit and listing-quality auditor for non-ingestible cat and dog supplies. Submit objective pet and product facts to receive a CLEAR, CAUTION, BLOCK, or HUMAN_REVIEW verdict, rule-level evidence, missing facts, seller-copy patches, and reproducible SHA-256 receipts. PawSift is not veterinary advice and does not evaluate food, medication, pesticides, symptoms, or medical suitability.

## Service description

Audit a non-ingestible cat or dog product listing against objective species, fit, materials, detachable-part, battery, magnet, care, and claim rules. Returns a structured verdict, score, findings, missing facts, owner questions, listing patches, safety boundary, ruleset version, and SHA-256 input/report receipt. Unsupported medical or ingestible claims route to HUMAN_REVIEW.

## Service JSON

```json
[
  {
    "serviceName": "PawSift Product Audit",
    "serviceDescription": "Audit a non-ingestible cat or dog product listing against objective fit and disclosure rules. Returns a structured verdict, evidence, missing facts, listing patches, and reproducible SHA-256 receipts. Unsupported medical or ingestible claims route to HUMAN_REVIEW.",
    "serviceType": "A2MCP",
    "fee": 0,
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
  --service '[{"serviceName":"PawSift Product Audit","serviceDescription":"Audit a non-ingestible cat or dog product listing against objective fit and disclosure rules. Returns a structured verdict, evidence, missing facts, listing patches, and reproducible SHA-256 receipts. Unsupported medical or ingestible claims route to HUMAN_REVIEW.","serviceType":"A2MCP","fee":0,"endpoint":"https://pawsift.vercel.app/api/v1/audit"}]'
```

6. Record the returned real Agent ID, select Done rather than adding another service, then run the listing validation exactly once before activation.

7. Activate the real Agent ID and preserve the backend review status.

```bash
/Users/stetang/.local/bin/onchainos agent activate \
  --agent-id "[PENDING_REAL_OKX_AGENT_ID]" \
  --preferred-language en-US
```

## Required evidence

- Real Agent ID returned by the CLI.
- `agent profile` output for that ID.
- `agent service-list` output showing one free A2MCP service and the production endpoint.
- Activation/review response.
- Public OKX.AI listing URL after approval.
- Signed-out endpoint replay matching the checked-in clear fixture receipt.
