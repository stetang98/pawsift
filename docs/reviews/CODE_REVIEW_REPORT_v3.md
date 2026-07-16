# Code Review Report v3

Date: 2026-07-16

Scope: reviewer-driven hardening for PS-008 scope detection, PS-011 category-specific weight completeness, HTTP 422 guidance, ruleset `2026.07.2`, hosted evidence, and deterministic proof regeneration.

## Initial independent review

Verdict: `CHANGES_REQUIRED`

The independent code reviewer found:

1. Realistic product names such as `Premium Cat Food` and `Freeze-Dried Dog Treats` could bypass the exact-field food/treat patterns.
2. A valid 500-character unsupported listing field could exceed the 500-character finding-evidence bound after adding its field path.
3. A request matching both PS-008 and a blocking rule returned HTTP 422 with an overall `BLOCK` guidance verdict.
4. The checked-in proof still referenced the prior ruleset and audited commit while the new source was uncommitted.

## Changes applied

- PS-008 now scans product name, materials, supervision text, care instructions, and claims with field-labeled evidence.
- Food/treat patterns cover realistic cat, dog, and pet product names while excluding common accessory suffixes.
- Oversized evidence is represented as the field path, matched scope labels, and a SHA-256 digest of the original value.
- PS-008 overrides the final disposition to `HUMAN_REVIEW`; all findings and penalties remain present, and other non-scope BLOCK precedence is unchanged.
- PS-011 requires minimum and maximum supported weight for collars/harnesses, and maximum supported weight for carriers and beds.
- Ruleset `2026.07.2` publishes 11 fixtures and a proof bound to source commit `1f5db8f0c60ca5530719f1f80e2302a4f5666431`.

## Verification

- `npm run check`: passed; 12 test files and 122 tests passed.
- `npm run test:e2e`: 9/9 passed, including 320 px and 390 px layout checks.
- Production health: HTTP 200, ruleset `2026.07.2`.
- Production examples: HTTP 200, 11 fixtures.
- Hosted clear receipt matched the local fixture.
- Hosted medical title and realistic food title returned HTTP 422 with `HUMAN_REVIEW`.
- Hosted missing-weight collar returned HTTP 200 with PS-011 `CAUTION`.
- Two consecutive proof exports produced SHA-256 `6c8ee50d259722079a224ec1675f78bd935bd3ac623de13c5e5a52ced7c4da67`.

## Final delta review

The same independent reviewer checked the proof pin, generated proof, source blobs, 11 fixtures, deployment attestation, document hash, and file digests. A non-writing rebuild matched the checked-in proof byte-for-byte.

Final findings: 0 Critical, 0 High, 0 Medium, 0 Low.

Verdict: `APPROVED`
