export function createLogger(env = {}) {
  const debugOn = Boolean(env.TTRPG_DEBUG);
  const write = (level, args) =>
    process.stderr.write(`[compendium-reader] ${level} ${args.join(" ")}\n`);
  return {
    debug: (...a) => { if (debugOn) write("DEBUG", a); },
    info: (...a) => write("INFO", a),
    warn: (...a) => write("WARN", a),
    error: (...a) => write("ERROR", a),
  };
}
