import { runOnce } from "./poller.js";

// --once is accepted for clarity in docs/demos; runOnce() is already a single pass either way
// (there's no internal scheduling loop — GitHub Actions' cron is the scheduler, see triage.yml).
await runOnce();
