# PawSift demo video QC

Date: 2026-07-16
Candidate: `artifacts/demo/pawsift-demo-final-v5-v4.mp4`

## Encoding

| Field | Verified value |
| --- | --- |
| Duration | `88.900000` seconds |
| File size | `6,513,854` bytes |
| Video | H.264 High, `1920 x 1080`, `30 fps` |
| Pixel format | `yuv420p`, BT.709 TV range |
| Audio | AAC LC, `48 kHz`, stereo |
| Integrated loudness | `-16.19 LUFS` |
| True peak | `-1.92 dBTP` |
| SHA-256 | `4a1dd2fe677b6e396b074446ae4cb6505deedab158795df2cc8fe2728b0630dc` |

## Visual and claim checks

- `blackdetect` reported no black interval of `0.45` seconds or longer.
- A ten-frame contact sheet and full-resolution frames covering CLEAR, PS-011, proof, OpenAPI, PS-008, and OKX status were inspected.
- English subtitles are burned in from full-video Whisper word timings; wording follows the narration rather than paraphrasing it.
- Subtitle size was reduced after full-resolution inspection so captions remain readable without hiding the product surface.
- The video shows ruleset `2026.07.7`, the current clear receipt, audited source commit `0a605986ba4b8dffe83a4ec0215fae660ec5d463`, PS-011 missing-weight guidance, and `product.name` normalized PS-008 evidence.
- The OKX.AI sequence shows real Agent ID `6036` and the exact current state `Listing under review`.
- The video does not claim that PawSift is approved, publicly listed, generating sales, or processing payments.
- The final narration uses the same natural Ryan voice pipeline as the approved source cues; changed lines were regenerated without synthetic speed-up.
- Complete decode succeeded, `blackdetect` found no interval of `0.45` seconds or longer, and the only silence of `0.8` seconds or longer is the intentional `2.95`-second outro.

## Publication gate

Do not publish this video or the prepared X post until the external teammate reviewer returns a submission-ready verdict. If OKX.AI approval arrives before publication, update the final status shot and claim wording, regenerate a new versioned video, and rerun this QC.
