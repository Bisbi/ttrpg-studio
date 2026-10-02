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
  // Whether the caller named the directories matters as much as which ones they are: a default
  // directory that is absent is an ordinary situation, while a directory someone asked for by name
  // and that turns out to hold nothing means the run examined a different tree than intended, and a
  // check that examined nothing must not report success.
  return {
    command,
    dirs: dirs.length > 0 ? dirs : [...DEFAULT_DIRS],
    explicitDirs: dirs.length > 0,
    json: argv.includes("--json"),
  };
}
