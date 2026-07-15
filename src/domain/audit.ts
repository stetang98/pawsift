import { canonicalize, sha256 } from "./canonical";
import { BOUNDARY_TEXT, RULES, RULESET_VERSION } from "./rules";
import {
  auditRequestSchema,
  auditResponseSchema,
  type AuditRequest,
  type AuditResponse,
  type Finding,
  type Verdict
} from "./schemas";

const VERDICT_PRIORITY: Record<Verdict, number> = {
  CLEAR: 0,
  CAUTION: 1,
  HUMAN_REVIEW: 2,
  BLOCK: 3
};

const FINDING_SORT_PRIORITY: Record<Verdict, number> = {
  BLOCK: 0,
  HUMAN_REVIEW: 1,
  CAUTION: 2,
  CLEAR: 3
};

function compareText(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function compareFindings(left: Finding, right: Finding): number {
  const severityDelta =
    FINDING_SORT_PRIORITY[left.severity] - FINDING_SORT_PRIORITY[right.severity];

  if (severityDelta !== 0) {
    return severityDelta;
  }

  return compareText(left.ruleId, right.ruleId);
}

function dedupeStable(values: string[]): string[] {
  const seen = new Set<string>();
  const stable: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    stable.push(value);
  }

  return stable;
}

export function auditProduct(input: AuditRequest): AuditResponse {
  const request = auditRequestSchema.parse(input);
  const matchedRules = RULES.filter((rule) => rule.applies(request))
    .map((rule) => ({
      rule,
      finding: rule.buildFinding(request)
    }))
    .sort((left, right) => compareFindings(left.finding, right.finding));

  const findings = matchedRules.map((entry) => entry.finding);
  const verdict = matchedRules.reduce<Verdict>(
    (current, entry) =>
      VERDICT_PRIORITY[entry.rule.verdictFloor] > VERDICT_PRIORITY[current]
        ? entry.rule.verdictFloor
        : current,
    "CLEAR"
  );

  const uniquePenaltyTotal = matchedRules.reduce(
    (state, entry) => {
      if (state.seen.has(entry.rule.id)) {
        return state;
      }

      state.seen.add(entry.rule.id);
      state.total += entry.rule.penalty;
      return state;
    },
    {
      seen: new Set<string>(),
      total: 0
    }
  ).total;
  const score = Math.max(0, Math.min(100, 100 - uniquePenaltyTotal));
  const missingFacts = dedupeStable(
    matchedRules.flatMap((entry) => entry.rule.missingFacts?.(request) ?? [])
  );
  const ownerQuestions = dedupeStable(
    matchedRules.flatMap((entry) => entry.rule.ownerQuestions?.(request) ?? [])
  );
  const listingPatch = dedupeStable(
    matchedRules.flatMap((entry) => entry.rule.listingPatch?.(request) ?? [])
  );
  const inputHash = sha256(canonicalize(request));
  const responseWithoutReportHash = {
    verdict,
    score,
    rulesetVersion: RULESET_VERSION,
    findings,
    missingFacts,
    ownerQuestions,
    listingPatch,
    boundary: BOUNDARY_TEXT,
    receipt: {
      algorithm: "sha256" as const,
      inputHash
    }
  };
  const reportHash = sha256(canonicalize(responseWithoutReportHash));

  return auditResponseSchema.parse({
    ...responseWithoutReportHash,
    receipt: {
      ...responseWithoutReportHash.receipt,
      reportHash
    }
  });
}
