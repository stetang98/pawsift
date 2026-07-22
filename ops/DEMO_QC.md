# PawSift demo video QC

Historical QC date: 2026-07-16
Historical candidate: `artifacts/demo/pawsift-demo-final-v6-v1.mp4`

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
- In this dated v6 artifact, the OKX.AI sequence accurately showed the 2026-07-16 CLI state: Agent ID `6036`, category `LIFESTYLE`, `Listing under review`, `not listed`, A2MCP, `0 USDT`, endpoint, and service record ID.
- The video does not claim that PawSift is approved, publicly listed, generating sales, or processing payments.
- The final narration uses the same natural Ryan voice pipeline as the approved source cues; changed lines were regenerated without synthetic speed-up.
- Complete decode succeeded and `blackdetect` found no interval of `0.45` seconds or longer. At `-40 dB` with a minimum duration of `0.8` seconds, `silencedetect` found natural sentence gaps at `5.048-5.907` and `24.080-24.882`, plus the intentional `85.945-88.900` outro.

## Historical publication gate

Cleared on 2026-07-16. The external teammate reviewer returned `Video upload: READY TO UPLOAD`, with no code, security, proof, deployment, or video blocker. The reviewer explicitly verified this file's SHA-256, 88.9-second runtime, complete playback, claim accuracy, and honest `Listing under review` wording.

Published post: https://x.com/Stetang3438/status/2077807252648656964

OKX.AI listing approval changed on 2026-07-22. This v6 artifact remains valid dated evidence but is no longer the final current-status demo.

## Superseded v7 candidate

Date: 2026-07-22

Candidate: `artifacts/demo/pawsift-demo-final-v7-v1.mp4`

| Field | Verified value |
| --- | --- |
| Duration | `88.900000` seconds |
| File size | `6,940,744` bytes |
| Video | H.264 High, `1920 x 1080`, `30 fps`, BT.709 TV range |
| Audio | AAC LC, `48 kHz`, stereo |
| Measured integrated loudness | `-16.6 LUFS` |
| Measured true peak | `-1.9 dBTP` |
| SHA-256 | `3533360fa6b6181e3681fb7de4d7f97d25be54071564e06c9b67ca4908a67008` |

The v7 candidate replaces only the final status visual, narration, and subtitles. The new frame records the independently verified 2026-07-22 official CLI results: Agent `6036`, `LIFESTYLE`, `active`, `Listed — eligible for task recommendations`, Service `34579`, A2MCP, `0 USDT`, and public-search visibility. Wallet and transaction address fields remain omitted. The complete command evidence path is shown above the subtitle-safe area.

- Full H.264/AAC decode completed with no error.
- `blackdetect` reported no interval of `0.45` seconds or longer.
- Key frames at `78.0` and `84.8` seconds were inspected at full resolution; the listing evidence remains readable and the synchronized captions do not obscure the status values.
- Whisper measured the replacement narration as `12.46` seconds and recovered the full listed/active/publicly-searchable claim. Subtitle cues were aligned to that measured segment rather than estimated timing.
- The existing first six narration cues and verified production/proof visuals are byte-identical inputs from v6; only the dated marketplace-state segment changed.
- Natural pauses of `0.86` and `0.80` seconds remain at the same positions as v6. No synthetic time compression was used.

The v7 file was not published. It was superseded after the proof source moved to the test-stability commit and review found a small closing-caption/footer overlap.

## Current v8 candidate

Date: 2026-07-22

Candidate: `artifacts/demo/pawsift-demo-final-v8-v2.mp4`

| Field | Verified value |
| --- | --- |
| Duration | `88.900000` seconds |
| File size | `6,799,677` bytes |
| Video | H.264 High, `1920 x 1080`, `30 fps`, BT.709 TV range |
| Audio | AAC LC, `48 kHz`, stereo |
| Measured integrated loudness | `-16.6 LUFS` |
| Measured true peak | `-1.9 dBTP` |
| SHA-256 | `33733d119e5e1c3c0fa4fea3af7085a8e090689f1b63d562a96099b48dd253d3` |

The v8 candidate retains the reviewed v7 narration and current listed-state evidence while replacing the proof frame with the public proof bound to audited source commit `d5e3d37b6877fd3cd305c78f0322615bc49badc6`. Proof SHA-256 `dab43bdf8b8ee0bd5fb6adea781a1afd0020d4ac599fac6701a54e64a3799c46` was identical across two default exports.

- Default `npm run check` passed with all 203 tests and the production build.
- `npm run test:e2e` ran directly without a forced browser reinstall and passed 9/9 flows.
- Full H.264/AAC decode completed with no error.
- `blackdetect` reported no interval of `0.45` seconds or longer.
- The final listed-state screen keeps Agent `6036`, `active`, approval, Service `34579`, endpoint, and public-search evidence visible.
- The nonessential bottom privacy footer is omitted only from the final status projection, leaving a dedicated subtitle-safe region; the closing caption no longer overlaps provenance or status evidence.
- The proof frame and final frame were inspected at full resolution after the final encode.

Publication remains gated on external reviewer approval. After approval, publish the v8 X post and submit the Google Form before 2026-07-27 23:59 UTC.
