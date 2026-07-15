import type { Species } from "../src/domain/schemas";

type PetProfileFormProps = {
  pet: {
    species: Species;
    lifeStage: string;
    weightKg: string;
    traits: string;
  };
  onPetChange: (
    field: "species" | "lifeStage" | "weightKg" | "traits",
    value: string
  ) => void;
};

export function PetProfileForm({ pet, onPetChange }: PetProfileFormProps) {
  return (
    <section className="audit-section" aria-labelledby="pet-profile-heading">
      <div className="audit-section-header">
        <div>
          <p className="audit-eyebrow">Pet profile</p>
          <h2 id="pet-profile-heading">Fit inputs</h2>
        </div>
        <p className="audit-section-copy">
          Enter only observable pet facts. PawSift does not infer medical condition,
          behavior training, or diagnosis.
        </p>
      </div>

      <div className="audit-form-grid audit-form-grid-two-up">
        <label className="audit-field">
          <span>Species</span>
          <select
            name="pet-species"
            value={pet.species}
            onChange={(event) => onPetChange("species", event.target.value)}
          >
            <option value="cat">Cat</option>
            <option value="dog">Dog</option>
          </select>
        </label>

        <label className="audit-field">
          <span>Life stage</span>
          <input
            name="pet-life-stage"
            type="text"
            required
            value={pet.lifeStage}
            onChange={(event) => onPetChange("lifeStage", event.target.value)}
          />
        </label>

        <label className="audit-field">
          <span>Weight (kg)</span>
          <input
            name="pet-weight"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            required
            value={pet.weightKg}
            onChange={(event) => onPetChange("weightKg", event.target.value)}
          />
        </label>

        <label className="audit-field audit-field-full">
          <span>Traits</span>
          <textarea
            name="pet-traits"
            rows={3}
            value={pet.traits}
            onChange={(event) => onPetChange("traits", event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
