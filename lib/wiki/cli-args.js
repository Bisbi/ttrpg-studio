// Turns the wiki command line into a plain options object.
// Argument parsing lives apart from the command itself so it can be tested without touching git or
// the filesystem, which the command unavoidably does.
const COMMANDS = ["validate", "index", "boundary", "stale", "all"];
const DEFAULT_DIRS = ["wiki", "local/wiki"];

export function parseWikiArgs(argv) {
  const command = COMMANDS.includes(argv[0]) ? argv[0] : null;
  const dirs = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir" && argv[i + 1]) { dirs.push(argv[i + 1]); i++; }
  }
  return {
    command,
    dirs: dirs.length > 0 ? dirs : [...DEFAULT_DIRS],
    json: argv.includes("--json"),
  };
}
