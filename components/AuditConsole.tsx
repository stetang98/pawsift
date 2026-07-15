"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Activity,
  RotateCcw,
  ScanSearch,
  ShieldCheck
} from "lucide-react";

import { clearCatCollarFixture } from "../src/domain/fixtures";
import { buildReceiptEnvelope } from "../src/domain/receipt-envelope";
import { BOUNDARY_TEXT, RULESET_VERSION } from "../src/domain/rules";
import type {
  AuditRequest,
  AuditResponse,
  Category,
  Species
} from "../src/domain/schemas";
import { AuditResult } from "./AuditResult";
import { PetProfileForm } from "./PetProfileForm";
import { ProductForm } from "./ProductForm";

type BooleanSelectValue = "unknown" | "true" | "false";

type AuditDraft = {
  pet: {
    species: Species;
    lifeStage: string;
    weightKg: string;
    traits: string;
  };
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
};

type ExampleRecord = {
  id: string;
  label: string;
  summary: string;
  request: AuditRequest;
  expectedVerdict: AuditResponse["verdict"];
  expectedRuleIds: string[];
  response: AuditResponse;
};

type ExamplesPayload = {
  name: string;
  version: string;
  endpoint: string;
  category: string;
  type: string;
  boundary: string;
  rulesetVersion: string;
  examples: ExampleRecord[];
};

type AuditApiError = {
  error?: {
    code?: string;
    message?: string;
  };
  guidance?: AuditResponse;
};

async function writeTextToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the DOM fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();

  const succeeded = document.execCommand("copy");
  textarea.remove();

  if (!succeeded) {
    throw new Error("Clipboard write failed");
  }
}

function normalizeList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function numberToField(value: number | undefined): string {
  return value === undefined ? "" : `${value}`;
}

function booleanToField(value: boolean | undefined): BooleanSelectValue {
  if (value === undefined) {
    return "unknown";
  }

  return value ? "true" : "false";
}

function fieldToBoolean(value: BooleanSelectValue): boolean | undefined {
  if (value === "unknown") {
    return undefined;
  }

  return value === "true";
}

function draftFromRequest(request: AuditRequest): AuditDraft {
  return {
    pet: {
      species: request.pet.species,
      lifeStage: request.pet.lifeStage,
      weightKg: numberToField(request.pet.weightKg),
      traits: request.pet.traits.join(", ")
    },
    product: {
      name: request.product.name,
      category: request.product.category,
      intendedSpecies: [...request.product.intendedSpecies],
      materials: request.product.materials.join(", "),
      minWeightKg: numberToField(request.product.minWeightKg),
      maxWeightKg: numberToField(request.product.maxWeightKg),
      lengthCm: numberToField(request.product.dimensionsCm?.lengthCm),
      widthCm: numberToField(request.product.dimensionsCm?.widthCm),
      heightCm: numberToField(request.product.dimensionsCm?.heightCm),
      breakaway: booleanToField(request.product.breakaway),
      hasDetachableParts: booleanToField(request.product.hasDetachableParts),
      supervisionStatement: request.product.supervisionStatement ?? "",
      containsBattery: booleanToField(request.product.containsBattery),
      containsMagnet: booleanToField(request.product.containsMagnet),
      careInstructions: request.product.careInstructions ?? "",
      claims: request.product.claims.join(", ")
    }
  };
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return Number.parseFloat(trimmed);
}

function buildDimensions(draft: AuditDraft["product"]): AuditRequest["product"]["dimensionsCm"] {
  const lengthCm = parseOptionalNumber(draft.lengthCm);
  const widthCm = parseOptionalNumber(draft.widthCm);
  const heightCm = parseOptionalNumber(draft.heightCm);

  if (lengthCm === undefined && widthCm === undefined && heightCm === undefined) {
    return undefined;
  }

  return {
    ...(lengthCm === undefined ? {} : { lengthCm }),
    ...(widthCm === undefined ? {} : { widthCm }),
    ...(heightCm === undefined ? {} : { heightCm })
  };
}

function requestFromDraft(draft: AuditDraft): AuditRequest {
  return {
    pet: {
      species: draft.pet.species,
      lifeStage: draft.pet.lifeStage.trim(),
      weightKg: Number.parseFloat(draft.pet.weightKg),
      traits: normalizeList(draft.pet.traits)
    },
    product: {
      name: draft.product.name.trim(),
      category: draft.product.category,
      intendedSpecies: draft.product.intendedSpecies,
      materials: normalizeList(draft.product.materials),
      ...(parseOptionalNumber(draft.product.minWeightKg) === undefined
        ? {}
        : { minWeightKg: parseOptionalNumber(draft.product.minWeightKg) }),
      ...(parseOptionalNumber(draft.product.maxWeightKg) === undefined
        ? {}
        : { maxWeightKg: parseOptionalNumber(draft.product.maxWeightKg) }),
      ...(buildDimensions(draft.product) === undefined
        ? {}
        : { dimensionsCm: buildDimensions(draft.product) }),
      ...(fieldToBoolean(draft.product.breakaway) === undefined
        ? {}
        : { breakaway: fieldToBoolean(draft.product.breakaway) }),
      ...(fieldToBoolean(draft.product.hasDetachableParts) === undefined
        ? {}
        : { hasDetachableParts: fieldToBoolean(draft.product.hasDetachableParts) }),
      ...(draft.product.supervisionStatement.trim()
        ? { supervisionStatement: draft.product.supervisionStatement.trim() }
        : {}),
      ...(fieldToBoolean(draft.product.containsBattery) === undefined
        ? {}
        : { containsBattery: fieldToBoolean(draft.product.containsBattery) }),
      ...(fieldToBoolean(draft.product.containsMagnet) === undefined
        ? {}
        : { containsMagnet: fieldToBoolean(draft.product.containsMagnet) }),
      ...(draft.product.careInstructions.trim()
        ? { careInstructions: draft.product.careInstructions.trim() }
        : {}),
      claims: normalizeList(draft.product.claims)
    }
  };
}

function cloneExampleRequest(example: ExampleRecord): AuditDraft {
  return draftFromRequest(example.request);
}

const DEFAULT_DRAFT = draftFromRequest(clearCatCollarFixture);
const DEFAULT_EXAMPLE_ID = "clear-cat-collar";

export function AuditConsole() {
  const [examples, setExamples] = useState<ExampleRecord[]>([]);
  const [draft, setDraft] = useState<AuditDraft>(DEFAULT_DRAFT);
  const [selectedExampleId, setSelectedExampleId] = useState(DEFAULT_EXAMPLE_ID);
  const [submittedRequest, setSubmittedRequest] = useState<AuditRequest | null>(null);
  const [report, setReport] = useState<AuditResponse | null>(null);
  const [rulesetVersion, setRulesetVersion] = useState(RULESET_VERSION);
  const [boundaryText, setBoundaryText] = useState(BOUNDARY_TEXT);
  const [serviceStatus, setServiceStatus] = useState("Loading fixtures");
  const [isRunning, setIsRunning] = useState(false);
  const [scopeMessage, setScopeMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const hasManualDraftEditsRef = useRef(false);
  const draftRevisionRef = useRef(0);

  const selectedExample =
    examples.find((example) => example.id === selectedExampleId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadExamples() {
      try {
        const response = await fetch("/api/v1/examples", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(`Fixture load failed with HTTP ${response.status}`);
        }

        const payload = (await response.json()) as ExamplesPayload;

        if (cancelled) {
          return;
        }

        setExamples(payload.examples);
        setRulesetVersion(payload.rulesetVersion);
        setBoundaryText(payload.boundary);
        setServiceStatus("Endpoint ready");

        const initialExample =
          payload.examples.find((example) => example.id === DEFAULT_EXAMPLE_ID) ??
          payload.examples[0];

        if (initialExample && !hasManualDraftEditsRef.current) {
          setSelectedExampleId(initialExample.id);
          setDraft(cloneExampleRequest(initialExample));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("[pawsift][console]", error);
        setServiceStatus("Fixture sync issue");
        setFormError("Fixture sync failed. You can still audit the current draft.");
      }
    }

    void loadExamples();

    return () => {
      cancelled = true;
    };
  }, []);

  const canonicalReceiptJson = useMemo(() => {
    if (!submittedRequest || !report) {
      return "";
    }

    return JSON.stringify(buildReceiptEnvelope(submittedRequest, report), null, 2);
  }, [report, submittedRequest]);

  function clearAuditResult() {
    setReport(null);
    setSubmittedRequest(null);
    setScopeMessage(null);
    setCopyState("idle");
  }

  function invalidateDraft(manualEdit: boolean) {
    draftRevisionRef.current += 1;
    hasManualDraftEditsRef.current = manualEdit;
    clearAuditResult();
    setFormError(null);
  }

  function updatePetField(
    field: keyof AuditDraft["pet"],
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      pet: {
        ...current.pet,
        [field]: value
      }
    }));
    invalidateDraft(true);
  }

  function updateProductField(
    field: keyof AuditDraft["product"],
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      product: {
        ...current.product,
        [field]: value
      }
    }));
    invalidateDraft(true);
  }

  function toggleIntendedSpecies(species: Species) {
    setDraft((current) => {
      const exists = current.product.intendedSpecies.includes(species);
      const intendedSpecies = exists
        ? current.product.intendedSpecies.filter((entry) => entry !== species)
        : [...current.product.intendedSpecies, species];

      return {
        ...current,
        product: {
          ...current.product,
          intendedSpecies
        }
      };
    });
    invalidateDraft(true);
  }

  function resetDraft() {
    if (selectedExample) {
      setDraft(cloneExampleRequest(selectedExample));
      invalidateDraft(false);
      return;
    }

    setDraft(DEFAULT_DRAFT);
    invalidateDraft(false);
  }

  function loadExample(example: ExampleRecord) {
    setSelectedExampleId(example.id);
    setDraft(cloneExampleRequest(example));
    invalidateDraft(false);
  }

  async function handleCopyJson() {
    if (!canonicalReceiptJson) {
      return;
    }

    try {
      await writeTextToClipboard(canonicalReceiptJson);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRunning(true);
    setFormError(null);
    setScopeMessage(null);
    setCopyState("idle");

    if (draft.product.intendedSpecies.length === 0) {
      setIsRunning(false);
      setFormError("Select at least one intended species before running the audit.");
      return;
    }

    const nextRequest = requestFromDraft(draft);
    const submissionRevision = draftRevisionRef.current;
    setSubmittedRequest(nextRequest);

    try {
      const response = await fetch("/api/v1/audit", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(nextRequest)
      });

      const payload = (await response.json()) as AuditResponse & AuditApiError;

      if (draftRevisionRef.current !== submissionRevision) {
        return;
      }

      if (response.ok) {
        setReport(payload);
        return;
      }

      const errorPayload = payload as AuditApiError;

      if (response.status === 422 && errorPayload.guidance) {
        setReport(errorPayload.guidance);
        setScopeMessage(
          errorPayload.error?.message ??
            "Request falls outside PawSift's supported non-veterinary scope."
        );
        return;
      }

      setFormError(
        errorPayload.error?.message ??
          `Audit request failed with HTTP ${response.status}.`
      );
      setReport(null);
    } catch (error) {
      console.error("[pawsift][submit]", error);
      setFormError("The audit request could not reach the local PawSift endpoint.");
      setReport(null);
    } finally {
      setIsRunning(false);
    }
  }

  const primaryActionLabel = isRunning ? "Running audit..." : "Run audit";

  return (
    <section className="audit-shell" aria-label="PawSift audit console">
      <header className="audit-command-bar">
        <div className="audit-command-status" aria-label="Service status">
          <span className="audit-status-pill">
            <ShieldCheck size={16} aria-hidden="true" />
            {serviceStatus}
          </span>
          <span className="audit-status-pill audit-status-pill-muted">
            <Activity size={16} aria-hidden="true" />
            Ruleset {rulesetVersion}
          </span>
        </div>
        <nav className="audit-command-links" aria-label="Machine contract links">
          <a href="/api/v1/health">Health</a>
          <a href="/api/v1/examples">Examples</a>
          <a href="/openapi.json">OpenAPI</a>
          <a href="/.well-known/pawsift.json">Metadata</a>
        </nav>
      </header>

      <div className="audit-workspace">
        <form className="audit-ticket" onSubmit={handleSubmit}>
          <section className="audit-section">
            <div className="audit-section-header">
              <div>
                <p className="audit-eyebrow">Operator ticket</p>
                <h2>Shared fixture deck</h2>
              </div>
              <p className="audit-section-copy">
                Load a reviewer-ready example, edit the facts, and run the same API that the
                public contract uses.
              </p>
            </div>
            <ul className="audit-example-grid" aria-label="Example fixtures">
              {examples.map((example) => (
                <li key={example.id}>
                  <button
                    type="button"
                    className="audit-example-button"
                    aria-pressed={selectedExampleId === example.id}
                    onClick={() => loadExample(example)}
                  >
                    <span>{example.label}</span>
                    <span className={`audit-verdict-chip audit-verdict-${example.expectedVerdict.toLowerCase()}`}>
                      {example.expectedVerdict}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="audit-example-summary" aria-live="polite">
              <p>{selectedExample?.summary ?? "Fixture deck will populate as soon as the local examples endpoint responds."}</p>
              <div className="audit-action-row">
                <button
                  type="submit"
                  className="audit-primary-button"
                  disabled={isRunning}
                >
                  <ScanSearch size={16} aria-hidden="true" />
                  {primaryActionLabel}
                </button>
                <button
                  type="button"
                  className="audit-secondary-button"
                  onClick={resetDraft}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  Reset draft
                </button>
              </div>
            </div>
          </section>

          {formError ? (
            <p className="audit-inline-message audit-inline-error" role="alert">
              {formError}
            </p>
          ) : null}

          <PetProfileForm
            pet={draft.pet}
            onPetChange={updatePetField}
          />

          <ProductForm
            product={draft.product}
            onProductChange={updateProductField}
            onToggleIntendedSpecies={toggleIntendedSpecies}
          />
        </form>

        <AuditResult
          boundaryText={boundaryText}
          canonicalReceiptJson={canonicalReceiptJson}
          copyState={copyState}
          onCopyJson={handleCopyJson}
          report={report}
          request={submittedRequest}
          scopeMessage={scopeMessage}
        />
      </div>
    </section>
  );
}
