// One-off script: seeds issue-triage-demo with sample issues for the agent to act on.
// Run once at repo setup: `npx tsx seed/seed-issues.ts`
import { Octokit } from "@octokit/rest";
import { readFileSync } from "node:fs";
import { config, repoParts } from "../src/config.js";

const octokit = new Octokit({ auth: config.githubToken });
const { owner, repo } = repoParts();
const issues: { title: string; body: string }[] = JSON.parse(
  readFileSync(new URL("./demo-issues.json", import.meta.url), "utf-8")
);

for (const issue of issues) {
  const { data } = await octokit.issues.create({ owner, repo, title: issue.title, body: issue.body });
  console.log(`created #${data.number}: ${issue.title}`);
}
