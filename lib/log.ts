/** Structured logger; Vercel captures stdout/stderr. Use instead of console in app code. */
export const log = {
  info: (msg: string, data: Record<string, unknown> = {}) =>
    process.stdout.write(JSON.stringify({ level: "info", msg, ...data }) + "\n"),
  warn: (msg: string, data: Record<string, unknown> = {}) =>
    process.stderr.write(JSON.stringify({ level: "warn", msg, ...data }) + "\n"),
  error: (msg: string, err: unknown, data: Record<string, unknown> = {}) =>
    process.stderr.write(
      JSON.stringify({
        level: "error",
        msg,
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
        ...data,
      }) + "\n",
    ),
};
