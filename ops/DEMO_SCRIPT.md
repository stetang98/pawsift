# PawSift demo script

Target runtime: at most 90 seconds. Language: English. Delivery: calm, natural product-demo voice. Subtitles use the exact narration and final full-video Whisper timings, not estimated timestamps.

## Shot and narration plan

| Time | Visual | Narration |
| --- | --- | --- |
| 0:00-0:10 | Production console opens; PawSift logo, endpoint status, ruleset `2026.07.7`, Agent 6036, and Bybit-inspired workspace are visible. | Pet listings can look complete while hiding the facts that actually decide fit. PawSift turns those facts into an auditable answer. |
| 0:10-0:24 | Show the exact current `CLEAR` collar result, PS-010, score, ruleset, and receipt. | This is a free Lifestyle A2MCP service for OKX.AI. I load a cat collar example, run the same production API used by agents, and get a clear verdict from versioned rules. |
| 0:24-0:37 | Show `Missing weight support`, PS-011, both missing bounds, operator question, and listing patch. | Now the collar omits its supported weight range. PawSift returns caution, cites PS zero eleven, asks for both limits, and drafts a seller-ready correction instead of guessing. |
| 0:37-0:49 | Show the current clear receipt followed by public `proof/proof.json`, audited commit, and ruleset. | Every result includes canonical SHA-256 input and report hashes. The checked-in proof binds these receipts to the audited Git commit and hosted fixture response. |
| 0:49-1:02 | Show the current public OpenAPI source. | The endpoint is public, schema-strict, OpenAPI documented, and needs no wallet, account, model key, or private data. Shopping agents can call it directly. |
| 1:02-1:15 | Show a zero-width-obfuscated product name returning PS-008 `HUMAN_REVIEW` with `product.name` and `normalized=...` evidence. | PawSift stays narrow. Food or medical wording, even when hidden with zero-width text in the product name, is normalized and routed to human review. |
| 1:15-1:26 | Show public OKX registration evidence with Agent ID `6036`, `Listing under review`, `not listed`, A2MCP, and 0 USDT. | PawSift is registered on OKX.AI as Agent six zero three six and is now under review. Know what fits before your pet finds out. |
| 1:26-1:29 | Return to the production console for a clean silent outro. | No narration. |

The final edit remains at or below 90 seconds without accelerating speech unnaturally.

Final local candidate: `artifacts/demo/pawsift-demo-final-v5-v4.mp4` (`88.9` seconds, SHA-256 `4a1dd2fe677b6e396b074446ae4cb6505deedab158795df2cc8fe2728b0630dc`). See `ops/DEMO_QC.md` for the verification record.

## Capture contract

- Record the real production origin `https://pawsift.vercel.app`.
- Show one complete `CLEAR` action and one complete `CAUTION` action.
- Show the JSON receipt hashes long enough to read.
- Show a real HTTP 200 response from the public audit endpoint.
- Show the real Agent ID and current official review state. Use the approved OKX.AI listing only after it exists; do not fabricate this shot.
- Use the generated PawSift logo and real product UI, not placeholder graphics.
- Hide browser profile details, unrelated tabs, wallet addresses, tokens, notifications, and private account data.
- Produce synchronized English subtitles from the final narration audio.
- Use a natural voice audition approved by listening before the full render.
- Export H.264/AAC MP4, 1920 x 1080, 30 fps, at most 90 seconds.

## Review gate

Do not publish the video before code, security, E2E, visual, claim-to-proof, and external `黑客松reviewer` reviews all return no blocker or high finding. Preserve the reviewed file hash in the final review report.
