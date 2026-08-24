import { test } from "node:test";
import assert from "node:assert/strict";
import { RunBudget } from "../src/guardrails/budget.js";
import { sanitizeReasoning } from "../src/agent/tools.js";

test("RunBudget stops after maxIssuesPerRun", () => {
  const budget = new RunBudget(2);
  assert.equal(budget.canProcessMore(), true);
  budget.record();
  assert.equal(budget.canProcessMore(), true);
  budget.record();
  assert.equal(budget.canProcessMore(), false);
  assert.equal(budget.count, 2);
});

test("sanitizeReasoning strips @mentions and URLs", () => {
  const out = sanitizeReasoning("cc @everyone see https://evil.example/payload for details");
  assert.ok(!out.includes("@everyone"));
  assert.ok(!out.includes("https://evil.example"));
  assert.match(out, /\[mention removed\]/);
  assert.match(out, /\[link removed\]/);
});

test("sanitizeReasoning truncates to 2000 chars", () => {
  const out = sanitizeReasoning("x".repeat(5000));
  assert.equal(out.length, 2000);
});
