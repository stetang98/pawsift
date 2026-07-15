import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  OctagonAlert,
  ShieldAlert
} from "lucide-react";

import type { AuditRequest, AuditResponse } from "../src/domain/schemas";
import { FindingList } from "./FindingList";
import { JsonReceipt } from "./JsonReceipt";

type AuditResultProps = {
  boundaryText: string;
  canonicalReceiptJson: string;
  copyState: "idle" | "copied" | "error";
  onCopyJson: () => void | Promise<void>;
  report: AuditResponse | null;
  request: AuditRequest | null;
  scopeMessage: string | null;
};

function verdictIcon(verdict: AuditResponse["verdict"]) {
  switch (verdict) {
    case "CLEAR":
      return <CheckCircle2 size={18} aria-hidden="true" />;
    case "CAUTION":
      return <AlertTriangle size={18} aria-hidden="true" />;
    case "BLOCK":
      return <OctagonAlert size={18} aria-hidden="true" />;
    case "HUMAN_REVIEW":
      return <ShieldAlert size={18} aria-hidden="true" />;
  }
}

function SectionList({
  heading,
  items,
  empty
}: {
  heading: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="audit-subsection">
      <h3>{heading}</h3>
      {items.length === 0 ? (
        <p className="audit-muted-copy">{empty}</p>
      ) : (
        <ul className="audit-inline-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AuditResult({
  boundaryText,
  canonicalReceiptJson,
  copyState,
  onCopyJson,
  report,
  request,
  scopeMessage
}: AuditResultProps) {
  return (
    <aside className="audit-market-panel" aria-live="polite">
      {!report || !request ? (
        <div className="audit-empty-state">
          <div className="audit-empty-icon">
            <FileWarning size={18} aria-hidden="true" />
          </div>
          <div>
            <h2>Verdict panel</h2>
            <p>
              Run the audit to render the deterministic verdict, stable rule findings,
              seller copy patch, and content-addressed receipt.
            </p>
          </div>
          <p className="audit-boundary-note">{boundaryText}</p>
        </div>
      ) : (
        <>
          <section className="audit-verdict-summary">
            <div className="audit-verdict-heading-row">
              <span className={`audit-verdict-chip audit-verdict-${report.verdict.toLowerCase()}`}>
                {verdictIcon(report.verdict)}
                {report.verdict}
              </span>
              <span className="audit-score-pill">Score {report.score}</span>
            </div>
            <h2>{report.verdict}</h2>
            <p className="audit-summary-copy">
              {request.product.name} for a {request.pet.lifeStage} {request.pet.species}.
            </p>
            <dl className="audit-summary-grid">
              <div>
                <dt>Ruleset</dt>
                <dd>{report.rulesetVersion}</dd>
              </div>
              <div>
                <dt>Finding count</dt>
                <dd>{report.findings.length}</dd>
              </div>
            </dl>
            {scopeMessage ? (
              <p className="audit-inline-message audit-inline-warning" role="status">
                {scopeMessage}
              </p>
            ) : null}
          </section>

          <section className="audit-subsection" aria-labelledby="findings-heading">
            <div className="audit-subsection-header">
              <h3 id="findings-heading">Rule findings</h3>
              <span className="audit-muted-copy">
                Stable evidence from the shared audit engine
              </span>
            </div>
            <FindingList findings={report.findings} />
          </section>

          <SectionList
            heading="Missing facts"
            items={report.missingFacts}
            empty="No missing fact fields were flagged."
          />

          <SectionList
            heading="Operator questions"
            items={report.ownerQuestions}
            empty="No follow-up questions are required for the supplied facts."
          />

          <SectionList
            heading="Listing patch"
            items={report.listingPatch}
            empty="No immediate listing patch is required from the supplied facts."
          />

          <JsonReceipt
            canonicalReceiptJson={canonicalReceiptJson}
            copyState={copyState}
            onCopyJson={onCopyJson}
            report={report}
          />

          <p className="audit-boundary-note">{report.boundary || boundaryText}</p>
        </>
      )}
    </aside>
  );
}
