import { listCandidateIssues } from "./github/client.js";
import { classifyIssue } from "./agent/classify.js";
import { RunBudget } from "./guardrails/budget.js";
import { config } from "./config.js";
import { logger } from "./logging.js";

const SKIP_LABELS = new Set(["triaged", "no-triage"]);

export async function runOnce(): Promise<void> {
  logger.info("run_start", { dryRun: config.dryRun, maxIssuesPerRun: config.maxIssuesPerRun });

  const issues = await listCandidateIssues();
  const candidates = issues.filter((i) => !i.labels.some((l) => SKIP_LABELS.has(l)));
  logger.info("candidates_found", { total: issues.length, candidates: candidates.length });

  const budget = new RunBudget(config.maxIssuesPerRun);
  let written = 0;
  let failed = 0;

  for (const issue of candidates) {
    if (!budget.canProcessMore()) {
      logger.info("run_budget_exhausted", { processed: budget.count, maxIssuesPerRun: config.maxIssuesPerRun });
      break;
    }
    budget.record();

    const result = await classifyIssue(issue, config.dryRun);
    if (result.ok) {
      if (!config.dryRun) written++;
    } else {
      failed++;
      logger.warn("triage_failed", { issue: issue.number, error: result.error });
    }
  }

  logger.info("run_complete", { dryRun: config.dryRun, processed: budget.count, written, failed });
}
