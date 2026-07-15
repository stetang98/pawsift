import { Check, ClipboardCopy, Download, TriangleAlert } from "lucide-react";

import type { AuditResponse } from "../src/domain/schemas";

type JsonReceiptProps = {
  canonicalReceiptJson: string;
  copyState: "idle" | "copied" | "error";
  onCopyJson: () => void | Promise<void>;
  report: AuditResponse;
};

function copyButtonLabel(copyState: JsonReceiptProps["copyState"]): string {
  if (copyState === "copied") {
    return "Copied JSON";
  }

  if (copyState === "error") {
    return "Retry copy";
  }

  return "Copy JSON";
}

export function JsonReceipt({
  canonicalReceiptJson,
  copyState,
  onCopyJson,
  report
}: JsonReceiptProps) {
  const downloadName = `pawsift-receipt-${report.receipt.reportHash.slice(0, 12)}.json`;
  const downloadHref = `data:application/json;charset=utf-8,${encodeURIComponent(canonicalReceiptJson)}`;

  return (
    <section className="audit-subsection" aria-labelledby="json-receipt-heading">
      <div className="audit-subsection-header">
        <h3 id="json-receipt-heading">Canonical receipt</h3>
        <div className="audit-action-row">
          <button
            type="button"
            className="audit-secondary-button"
            onClick={() => {
              void onCopyJson();
            }}
          >
            {copyState === "copied" ? (
              <Check size={16} aria-hidden="true" />
            ) : copyState === "error" ? (
              <TriangleAlert size={16} aria-hidden="true" />
            ) : (
              <ClipboardCopy size={16} aria-hidden="true" />
            )}
            {copyButtonLabel(copyState)}
          </button>
          <a className="audit-secondary-button" href={downloadHref} download={downloadName}>
            <Download size={16} aria-hidden="true" />
            Download JSON
          </a>
        </div>
      </div>

      <dl className="audit-receipt-grid">
        <div>
          <dt>Algorithm</dt>
          <dd>{report.receipt.algorithm}</dd>
        </div>
        <div>
          <dt>Input hash</dt>
          <dd>{report.receipt.inputHash}</dd>
        </div>
        <div>
          <dt>Report hash</dt>
          <dd>{report.receipt.reportHash}</dd>
        </div>
      </dl>

      <pre className="audit-json-block">{canonicalReceiptJson}</pre>
    </section>
  );
}
