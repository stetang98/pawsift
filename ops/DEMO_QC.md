# PawSift demo video QC

Date: 2026-07-16
Candidate: `artifacts/demo/pawsift-demo-final-v6-v1.mp4`

## Encoding

| Field | Verified value |
| --- | --- |
| Duration | `88.900000` seconds |
| File size | `6,810,934` bytes |
| Video | H.264 High, `1920 x 1080`, `30 fps` |
| Pixel format | `yuv420p`, BT.709 TV range, matrix, primaries, and transfer |
| Audio | AAC LC, `48 kHz`, stereo |
| Integrated loudness | `-16.19 LUFS` |
| True peak | `-1.92 dBTP` |
| SHA-256 | `0e6dfee83f0f4d9c2a9e3c8630344406c2ec1b6d548cfdfa4916210177919623` |

## Visual and claim checks

- `blackdetect` reported no black interval of `0.45` seconds or longer.
- Full-resolution frames covering CLEAR, PS-011, proof, public HTTP 200 evidence, OpenAPI, PS-008, and OKX status were inspected.
- English subtitles are burned in from full-video Whisper word timings; wording follows the narration rather than paraphrasing it.
- Subtitle size was reduced after full-resolution inspection so captions remain readable without hiding the product surface.
- The video shows ruleset `2026.07.7`, the current clear receipt, audited source commit `0a605986ba4b8dffe83a4ec0215fae660ec5d463`, PS-011 missing-weight guidance, and `product.name` normalized PS-008 evidence.
- The public API segment shows a real `curl -i -X POST https://pawsift.vercel.app/api/v1/audit` response with `HTTP/2 200` and `x-pawsift-ruleset: 2026.07.7`.
- The OKX.AI sequence shows the official CLI's current Agent ID `6036`, marketplace category `LIFESTYLE`, `Listing under review`, `not listed`, A2MCP, `0 USDT`, endpoint, and service record ID; wallet and transaction address fields are omitted from the frame.
- The video does not claim that PawSift is approved, publicly listed, generating sales, or processing payments.
- The final narration uses the same natural Ryan voice pipeline as the approved source cues; changed lines were regenerated without synthetic speed-up.
- Complete decode succeeded and `blackdetect` found no interval of `0.45` seconds or longer. At `-40 dB` with a minimum duration of `0.8` seconds, `silencedetect` found natural sentence gaps at `5.048-5.907` and `24.080-24.882`, plus the intentional `85.945-88.900` outro.

## Publication gate

Do not publish this video or the prepared X post until the external teammate reviewer returns a submission-ready verdict. If OKX.AI approval arrives before publication, update the final status shot and claim wording, regenerate a new versioned video, and rerun this QC.
