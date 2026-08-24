// Fails fast on missing required env vars — mirrors Project 1's app/config.py
// (refuse to boot rather than fail on the first real request/run).

if (process.env.NODE_ENV !== "test") {
  try {
    process.loadEnvFile(".env");
  } catch {
    // .env is optional locally (e.g. CI supplies real env vars directly) — fine if missing.
  }
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  githubToken: required("TRIAGE_GITHUB_TOKEN"),
  triageRepo: required("TRIAGE_REPO"), // "owner/repo"
  model: process.env.CLAUDE_MODEL?.trim() || "claude-sonnet-5",
  dryRun: (process.env.DRY_RUN ?? "true").trim().toLowerCase() !== "false",
  maxIssuesPerRun: Number(process.env.MAX_ISSUES_PER_RUN ?? "15"),
};

export function repoParts(): { owner: string; repo: string } {
  const [owner, repo] = config.triageRepo.split("/");
  if (!owner || !repo) {
    throw new Error(`TRIAGE_REPO must be "owner/repo", got: ${config.triageRepo}`);
  }
  return { owner, repo };
}
