// The agent's single tool. Built fresh per issue by classify.ts so the closure binds
// exactly one issue/repo — the model has no `issue_number`/`repo` parameter to redirect
// which issue it acts on (structural guardrail, see README "Prompt injection").
import { z } from "zod";
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { submitTriage } from "../github/client.js";
import { logger } from "../logging.js";

export const TYPE_LABELS = ["bug", "feature", "question", "duplicate", "chore"] as const;
export const PRIORITY_LABELS = ["high", "medium", "low", "none"] as const;

const MAX_COMMENT_LENGTH = 2000;

/** Strips @mentions and URLs from model-generated free text before it's posted to a public
 *  page — layer 2 of the injection defense (layer 1 is the closure binding above; wrong TARGET
 *  is structurally impossible, wrong/harmful CONTENT in this field is mitigated, not proven
 *  impossible). See README "Prompt injection" for the full three-layer writeup. */
export function sanitizeReasoning(text: string): string {
  return text
    .replace(/@[\w-]+/g, "[mention removed]")
    .replace(/https?:\/\/\S+/g, "[link removed]")
    .slice(0, MAX_COMMENT_LENGTH);
}

export type TriageResult = { type: (typeof TYPE_LABELS)[number]; priority: (typeof PRIORITY_LABELS)[number]; reasoning: string };

export function buildTriageServer(opts: {
  issueNumber: number;
  dryRun: boolean;
  onSubmit?: (result: TriageResult) => void;
}) {
  let fired = false; // enforces exactly one submit_triage call per issue

  const submitTriageTool = tool(
    "submit_triage",
    "Classify this issue and record the triage decision. Call exactly once.",
    {
      type: z.enum(TYPE_LABELS),
      priority: z.enum(PRIORITY_LABELS),
      reasoning: z.string().min(1).max(MAX_COMMENT_LENGTH),
    },
    async (args) => {
      if (fired) {
        return {
          content: [{ type: "text" as const, text: "submit_triage already called for this issue — ignore, do not retry." }],
          isError: true,
        };
      }
      fired = true;
      opts.onSubmit?.(args);

      const labels = [`type:${args.type}`, ...(args.priority !== "none" ? [`priority:${args.priority}`] : [])];
      const comment = `**Triage:** ${labels.join(", ")}\n\n${sanitizeReasoning(args.reasoning)}\n\n_Automated triage by [github-issue-triage-agent](https://github.com/rakeshsabbisetty2001/github-issue-triage-agent)._`;

      if (opts.dryRun) {
        logger.info("dry_run_submit_triage", { issue: opts.issueNumber, type: args.type, priority: args.priority, labels });
      } else {
        await submitTriage(opts.issueNumber, comment, labels);
        logger.info("submit_triage", { issue: opts.issueNumber, type: args.type, priority: args.priority, labels });
      }

      return { content: [{ type: "text" as const, text: "Triage recorded." }] };
    }
  );

  return createSdkMcpServer({ name: "triage-tools", tools: [submitTriageTool] });
}
