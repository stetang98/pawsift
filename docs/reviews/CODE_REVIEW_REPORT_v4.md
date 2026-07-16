# Code Review Report v4

Date: 2026-07-16

Scope: reviewer-driven hardening of PS-008 medical/ingestible scope detection through ruleset `2026.07.7`, including joined wording, Unicode separators and format controls, bounded field evidence, accessory exceptions, and false-positive resistance.

## Independent review rounds

The mandatory independent `code-reviewer` was rerun after every code change. Successive rounds found and closed these issues:

1. Unknown ingestible qualifiers and Unicode dash variants could hide before food/treat accessory terms.
2. Zero-width and other Unicode format controls could split scope words or fuse neighboring tokens.
3. Joined and underscored forms such as `FoodBowl`, `Food_Bowl`, and `TreatPouch` needed the same fail-closed treatment as spaced forms.
4. Broad compact matching risked false positives for benign words such as `Healthy`, `Foodie`, `FleaMarket`, and `Stainless`.
5. Long obfuscated values needed a bounded normalized preview plus content hashes rather than unbounded evidence.
6. Format-control evidence needed to remain visible even when the detected scope token was otherwise unchanged.

## Changes applied

- Normalize user-controlled listing text with NFKC and Unicode dash handling.
- Evaluate both boundary-preserving and compact format-control views without relying on broad substring matches.
- Tokenize context with Unicode-aware boundaries and explicit accessory phrase handling.
- Route unknown or ingestible qualifiers to `HUMAN_REVIEW` while preserving recognized non-ingestible accessory contexts.
- Label evidence with the source field and add a bounded visible `normalized=...` preview when format controls are present.
- Keep evidence at or below the schema limit with SHA-256 digests for long values.
- Add domain, route, fixture, proof, and browser regressions for the reviewed cases.

## Final review

Final independent reviewer: `code-reviewer` agent `019f69b9-7ccb-7230-9110-f8f5527adeaa`.

Verdict: `CODE APPROVED`

No Critical, High, Medium, or Low code finding remained in the reviewed delta. Release-level build, E2E, proof reproducibility, hosted-contract, secret-scan, and media checks are tracked separately because they validate the packaged artifact rather than replace the mandatory code review.

## Release verification

- Audited source commit: `0a605986ba4b8dffe83a4ec0215fae660ec5d463`.
- `npm run check`: passed; 12 test files and 201 tests passed, followed by a successful production build.
- `npm run test:e2e`: 9/9 passed.
- Two consecutive proof exports were byte-identical with SHA-256 `f90bdc08aba7fdf789dc6aa7bab6ec557e9224939f337f1571bb9ca047da2ce4`.
- Hosted production returned ruleset `2026.07.7`, 12 examples, the attested clear receipt, PS-011 missing-weight caution, and PS-008 human review for the reviewed Unicode-obfuscation cases.
