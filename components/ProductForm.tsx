import type { Category, Species } from "../src/domain/schemas";

type BooleanSelectValue = "unknown" | "true" | "false";

type ProductFormProps = {
  product: {
    name: string;
    category: Category;
    intendedSpecies: Species[];
    materials: string;
    minWeightKg: string;
    maxWeightKg: string;
    lengthCm: string;
    widthCm: string;
    heightCm: string;
    breakaway: BooleanSelectValue;
    hasDetachableParts: BooleanSelectValue;
    supervisionStatement: string;
    containsBattery: BooleanSelectValue;
    containsMagnet: BooleanSelectValue;
    careInstructions: string;
    claims: string;
  };
  onProductChange: (field: keyof ProductFormProps["product"], value: string) => void;
  onToggleIntendedSpecies: (species: Species) => void;
};

const PRODUCT_CATEGORIES: Array<{
  value: Category;
  label: string;
}> = [
  {
    value: "toy",
    label: "Toy"
  },
  {
    value: "carrier",
    label: "Carrier"
  },
  {
    value: "bed",
    label: "Bed"
  },
  {
    value: "feeder",
    label: "Feeder"
  },
  {
    value: "collar_harness",
    label: "Collar or harness"
  },
  {
    value: "grooming_tool",
    label: "Grooming tool"
  }
];

const BOOLEAN_OPTIONS: Array<{
  value: BooleanSelectValue;
  label: string;
}> = [
  {
    value: "unknown",
    label: "Unknown"
  },
  {
    value: "true",
    label: "Yes"
  },
  {
    value: "false",
    label: "No"
  }
];

const SPECIES_OPTIONS: Species[] = ["cat", "dog"];

export function ProductForm({
  product,
  onProductChange,
  onToggleIntendedSpecies
}: ProductFormProps) {
  return (
    <section className="audit-section" aria-labelledby="product-facts-heading">
      <div className="audit-section-header">
        <div>
          <p className="audit-eyebrow">Product facts</p>
          <h2 id="product-facts-heading">Listing fields</h2>
        </div>
        <p className="audit-section-copy">
          The audit uses only the supplied listing facts. Unsupported medical or ingestible
          claims will route to human review.
        </p>
      </div>

      <div className="audit-form-grid audit-form-grid-two-up">
        <label className="audit-field audit-field-full">
          <span>Product name</span>
          <input
            name="product-name"
            type="text"
            required
            value={product.name}
            onChange={(event) => onProductChange("name", event.target.value)}
          />
        </label>

        <label className="audit-field">
          <span>Category</span>
          <select
            name="product-category"
            value={product.category}
            onChange={(event) => onProductChange("category", event.target.value)}
          >
            {PRODUCT_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="audit-field">
          <legend>Intended species</legend>
          <div className="audit-checkbox-row">
            {SPECIES_OPTIONS.map((species) => (
              <label key={species} className="audit-checkbox">
                <input
                  type="checkbox"
                  checked={product.intendedSpecies.includes(species)}
                  onChange={() => onToggleIntendedSpecies(species)}
                />
                <span>{species === "cat" ? "Cat" : "Dog"}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="audit-field audit-field-full">
          <span>Materials</span>
          <textarea
            name="product-materials"
            rows={3}
            value={product.materials}
            onChange={(event) => onProductChange("materials", event.target.value)}
          />
        </label>

        <label className="audit-field">
          <span>Min weight (kg)</span>
          <input
            name="product-min-weight"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={product.minWeightKg}
            onChange={(event) => onProductChange("minWeightKg", event.target.value)}
          />
        </label>

        <label className="audit-field">
          <span>Max weight (kg)</span>
          <input
            name="product-max-weight"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={product.maxWeightKg}
            onChange={(event) => onProductChange("maxWeightKg", event.target.value)}
          />
        </label>

        <label className="audit-field">
          <span>Length (cm)</span>
          <input
            name="product-length"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={product.lengthCm}
            onChange={(event) => onProductChange("lengthCm", event.target.value)}
          />
        </label>

        <label className="audit-field">
          <span>Width (cm)</span>
          <input
            name="product-width"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={product.widthCm}
            onChange={(event) => onProductChange("widthCm", event.target.value)}
          />
        </label>

        <label className="audit-field">
          <span>Height (cm)</span>
          <input
            name="product-height"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={product.heightCm}
            onChange={(event) => onProductChange("heightCm", event.target.value)}
          />
        </label>

        <label className="audit-field">
          <span>Breakaway release</span>
          <select
            name="product-breakaway"
            value={product.breakaway}
            onChange={(event) => onProductChange("breakaway", event.target.value)}
          >
            {BOOLEAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="audit-field">
          <span>Detachable parts</span>
          <select
            name="product-detachable-parts"
            value={product.hasDetachableParts}
            onChange={(event) => onProductChange("hasDetachableParts", event.target.value)}
          >
            {BOOLEAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="audit-field">
          <span>Contains battery</span>
          <select
            name="product-battery"
            value={product.containsBattery}
            onChange={(event) => onProductChange("containsBattery", event.target.value)}
          >
            {BOOLEAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="audit-field">
          <span>Contains magnet</span>
          <select
            name="product-magnet"
            value={product.containsMagnet}
            onChange={(event) => onProductChange("containsMagnet", event.target.value)}
          >
            {BOOLEAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="audit-field audit-field-full">
          <span>Supervision statement</span>
          <textarea
            name="product-supervision"
            rows={3}
            value={product.supervisionStatement}
            onChange={(event) =>
              onProductChange("supervisionStatement", event.target.value)
            }
          />
        </label>

        <label className="audit-field audit-field-full">
          <span>Care instructions</span>
          <textarea
            name="product-care"
            rows={3}
            value={product.careInstructions}
            onChange={(event) => onProductChange("careInstructions", event.target.value)}
          />
        </label>

        <label className="audit-field audit-field-full">
          <span>Claims</span>
          <textarea
            name="product-claims"
            rows={4}
            value={product.claims}
            onChange={(event) => onProductChange("claims", event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
