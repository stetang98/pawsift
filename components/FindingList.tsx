import { AlertTriangle, CheckCircle2, OctagonAlert, ShieldAlert } from "lucide-react";

import type { Finding } from "../src/domain/schemas";

type FindingListProps = {
  findings: Finding[];
};

function findingIcon(severity: Finding["severity"]) {
  switch (severity) {
    case "CLEAR":
      return <CheckCircle2 size={16} aria-hidden="true" />;
    case "CAUTION":
      return <AlertTriangle size={16} aria-hidden="true" />;
    case "BLOCK":
      return <OctagonAlert size={16} aria-hidden="true" />;
    case "HUMAN_REVIEW":
      return <ShieldAlert size={16} aria-hidden="true" />;
  }
}

export function FindingList({ findings }: FindingListProps) {
  if (findings.length === 0) {
    return <p className="audit-muted-copy">No rule findings were returned.</p>;
  }

  return (
    <ol className="audit-finding-list">
      {findings.map((finding) => (
        <li key={finding.ruleId} className="audit-finding-item">
          <div className="audit-finding-heading">
            <span className={`audit-verdict-chip audit-verdict-${finding.severity.toLowerCase()}`}>
              {findingIcon(finding.severity)}
              {finding.severity}
            </span>
            <strong>{finding.ruleId}</strong>
          </div>
          <h3>{finding.title}</h3>
          <p>{finding.reason}</p>
          <ul className="audit-inline-list" aria-label={`${finding.ruleId} evidence`}>
            {finding.evidence.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          <p className="audit-remediation">{finding.remediation}</p>
        </li>
      ))}
    </ol>
  );
}
