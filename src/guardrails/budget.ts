// Per-run cost ceiling on BREADTH (how many issues). Depth (per-issue cost) is bounded
// separately by maxTurns/maxBudgetUsd in agent/classify.ts — both are needed.
export class RunBudget {
  private processed = 0;
  constructor(private readonly maxIssuesPerRun: number) {}

  canProcessMore(): boolean {
    return this.processed < this.maxIssuesPerRun;
  }

  record(): void {
    this.processed++;
  }

  get count(): number {
    return this.processed;
  }
}
