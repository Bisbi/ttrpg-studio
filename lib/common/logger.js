// Builds a small stderr logger. Everything goes to stderr, not stdout, so that tools which print
// structured data on stdout are never polluted by log lines. Debug output is gated behind an
// env var so it stays silent by default and can be turned on without a code change.
export function createLogger(env = {}) {
  const debugOn = Boolean(env.TTRPG_DEBUG);
  const write = (level, args) =>
    process.stderr.write(`[ttrpg-studio] ${level} ${args.join(" ")}\n`);
  return {
    debug: (...a) => { if (debugOn) write("DEBUG", a); },
    info: (...a) => write("INFO", a),
    warn: (...a) => write("WARN", a),
    error: (...a) => write("ERROR", a),
  };
}
