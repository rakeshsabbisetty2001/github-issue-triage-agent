// Structured JSON logging to stdout — mirrors Project 1's app/logging_config.py.

type LogFields = Record<string, unknown>;

function log(level: "info" | "warn" | "error", event: string, fields: LogFields = {}): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields }));
}

export const logger = {
  info: (event: string, fields?: LogFields) => log("info", event, fields),
  warn: (event: string, fields?: LogFields) => log("warn", event, fields),
  error: (event: string, fields?: LogFields) => log("error", event, fields),
};
