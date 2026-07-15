# Safety boundary

PawSift is a listing completeness and objective fit audit for non-ingestible pet supplies. It is not a veterinary, medical, behavioral, or legal decision system.

## Supported scope

- Cats and dogs.
- Toys, carriers, beds, feeders, collars/harnesses, and grooming tools.
- Supplied species, life stage, weight, materials, dimensions, fit range, detachable parts, batteries, magnets, care instructions, supervision text, and listing claims.
- Deterministic findings about mismatches, missing facts, and disclosure gaps.

## Excluded scope

- Food, treats, supplements, medication, pesticides, flea/tick treatments, chemical treatments, or ingestible products.
- Symptoms, diagnosis, recovery, allergies, toxicity, dosage, treatment, pain, anxiety, or disease.
- Claims that any product is medically safe, veterinarian approved, or hazard free.
- Verification of a seller's truthfulness or inspection of a physical product.

## Verdict meanings

| Verdict | Meaning |
| --- | --- |
| `CLEAR` | No blocking or caution rule fired from the supplied facts. Unknown hazards may still exist. |
| `CAUTION` | Information is missing or a disclosure should be improved before relying on the listing. |
| `BLOCK` | A stated species or fit limit conflicts with the supplied pet profile. |
| `HUMAN_REVIEW` | The listing contains a battery, magnet, medical, treatment, or ingestible signal outside automated approval scope. |

## Data and privacy

The service needs no account, pet name, owner identity, contact information, wallet, or location. Clients should submit only product and pet-fit facts. The launch implementation does not persist audit requests.

## Failure posture

- Strict schemas reject unknown fields and bound free text.
- Non-finite and negative measurements are rejected.
- Invalid JSON, unsupported media type, oversized payload, and unexpected failures return sanitized errors.
- The result always repeats the non-veterinary boundary.
- Unsupported claims route to human review rather than being silently accepted.

## Responsible use

Users remain responsible for checking manufacturer instructions, observing the pet, discontinuing use when damage or distress appears, and consulting a qualified veterinarian for health questions.
