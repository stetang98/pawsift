# PawSift demo video QC

Date: 2026-07-15  
Candidate: `artifacts/demo/pawsift-demo-final-v4.mp4`

## Encoding

| Field | Verified value |
| --- | --- |
| Duration | `81.400000` seconds |
| File size | `6,999,535` bytes |
| Video | H.264 High, `1920 x 1080`, `30 fps` |
| Pixel format | `yuv420p`, TV range |
| Audio | AAC LC, `48 kHz`, stereo |
| Integrated loudness | `-16.0 LUFS` |
| True peak | `-2.0 dBTP` |
| SHA-256 | `42efe405845e4d6760617f346e4ec5773c72a511dc2710711aec888c9ff1062f` |

## Visual and claim checks

- `blackdetect` reported no black interval of `0.45` seconds or longer.
- A ten-frame contact sheet and full-resolution frames at `72.0`, `76.5`, and `78.8` seconds were inspected.
- English subtitles are burned into the video from the final narration timings.
- Subtitle size was reduced after full-resolution inspection so captions do not dominate or hide the product surface.
- The OKX.AI sequence shows real Agent ID `6036` and the exact current state `Listing under review`.
- The video does not claim that PawSift is approved, publicly listed, generating sales, or processing payments.
- The final narration uses the same natural Ryan voice pipeline as the approved source cues; no synthetic speed-up was applied.

## Publication gate

Do not publish this video or the prepared X post until the external teammate reviewer returns a submission-ready verdict. If OKX.AI approval arrives before publication, update the final status shot and claim wording, regenerate a new versioned video, and rerun this QC.
