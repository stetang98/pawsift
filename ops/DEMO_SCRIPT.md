# PawSift demo script

Target runtime: 78-84 seconds. Language: English. Delivery: calm, natural product-demo voice at roughly 135 words per minute. Subtitles must use the exact narration and be aligned from the final voice waveform, not estimated timestamps.

## Shot and narration plan

| Time | Visual | Narration |
| --- | --- | --- |
| 0:00-0:06 | Production console opens; PawSift logo, live status, and compact Bybit-inspired workspace visible. | Pet listings can look complete while hiding the facts that actually decide fit. PawSift turns those facts into an auditable answer. |
| 0:06-0:19 | Load the exact UI fixture `Clear collar example`, run the audit, then frame the green `CLEAR` verdict and score. | This is a free Lifestyle A2MCP service on OKX.AI. I load a cat collar example, run the same production API used by agents, and get a clear verdict from versioned rules. |
| 0:19-0:34 | Load the exact UI fixture `Missing materials`, run, frame `CAUTION`, PS-003 evidence, missing fact, owner question, and listing patch. | Now the grooming listing omits materials. PawSift returns caution, cites the exact rule, asks for the missing fact, and drafts a seller-ready correction instead of guessing. |
| 0:34-0:47 | Expand JSON receipt and show input hash, report hash, ruleset, copy/download controls. | Every result includes canonical SHA-256 input and report hashes. The checked-in proof binds these receipts to the audited Git commit and hosted fixture response. |
| 0:47-1:01 | Open `/openapi.json`, then show a terminal or API client calling `POST /api/v1/audit` and receiving HTTP 200. | The endpoint is public, schema-strict, OpenAPI documented, and needs no wallet, account, model key, or private data. Shopping agents can call it directly. |
| 1:01-1:13 | Show a medical or ingestible claim returning `HUMAN_REVIEW`, with safety boundary visible. | PawSift stays narrow. Food, medication, pesticides, and medical claims never receive automated approval; they route to human review. |
| 1:13-1:22 | Show the approved OKX.AI PawSift listing and real Agent ID, then return to the live console. | PawSift is live on OKX.AI as a free A2MCP service. Know what fits before your pet finds out. |

Estimated narration: about 180 words. The final edit must trim pauses or lines as needed to remain at or below 90 seconds without accelerating speech unnaturally.

## Capture contract

- Record the real production origin `https://pawsift.vercel.app`.
- Show one complete `CLEAR` action and one complete `CAUTION` action.
- Show the JSON receipt hashes long enough to read.
- Show a real HTTP 200 response from the public audit endpoint.
- Show the approved OKX.AI listing and real Agent ID; do not fabricate this shot.
- Use the generated PawSift logo and real product UI, not placeholder graphics.
- Hide browser profile details, unrelated tabs, wallet addresses, tokens, notifications, and private account data.
- Produce synchronized English subtitles from the final narration audio.
- Use a natural voice audition approved by listening before the full render.
- Export H.264/AAC MP4, 1920 x 1080, 30 fps, at most 90 seconds.

## Review gate

Do not publish the video before code, security, E2E, visual, claim-to-proof, and external `黑客松reviewer` reviews all return no blocker or high finding. Preserve the reviewed file hash in the final review report.
