// Thin Octokit wrapper — the only place that talks to the real GitHub API.
import { Octokit } from "@octokit/rest";
import { config, repoParts } from "../config.js";
import { logger } from "../logging.js";

export type Issue = {
  number: number;
  title: string;
  body: string;
  labels: string[];
};

const octokit = new Octokit({ auth: config.githubToken });

async function withRetry<T>(op: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status;
      if (status === 403 || status === 429) {
        const retryAfter = Number(err?.response?.headers?.["retry-after"] ?? attempt * 2);
        logger.warn("github_rate_limited", { op, attempt, retryAfterSeconds: retryAfter });
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/** Open issues, PRs excluded, most-recent labels included. */
export async function listCandidateIssues(): Promise<Issue[]> {
  const { owner, repo } = repoParts();
  const items = await withRetry("listForRepo", () =>
    octokit.paginate(octokit.issues.listForRepo, { owner, repo, state: "open", per_page: 100 })
  );
  return items
    .filter((i) => !("pull_request" in i && i.pull_request)) // listForRepo returns PRs as issues too
    .map((i) => ({
      number: i.number,
      title: i.title,
      body: i.body ?? "",
      labels: i.labels.map((l) => (typeof l === "string" ? l : l.name ?? "")),
    }));
}

/** Posts a comment, then applies type/priority/`triaged` labels in ONE addLabels call last.
 *  Comment-then-label ordering: `triaged` can only ever mean "fully done, comment included" —
 *  a crash between the two steps leaves the issue untriaged (retried next run) instead of
 *  permanently mislabeled with no explanation. Known limitation: a crash AFTER the comment but
 *  BEFORE the label call means the retry can post a second comment — accepted as strictly better
 *  than a silent mislabel (see README Known limitations). */
export async function submitTriage(
  issueNumber: number,
  comment: string,
  labels: string[]
): Promise<void> {
  const { owner, repo } = repoParts();
  await withRetry("createComment", () =>
    octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body: comment })
  );
  await withRetry("addLabels", () =>
    octokit.issues.addLabels({ owner, repo, issue_number: issueNumber, labels: [...labels, "triaged"] })
  );
}
