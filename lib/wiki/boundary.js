// Compares the scope each node declares against what git actually tracks.
// The declaration alone protects nothing - it is an assertion, and this is the check that makes it
// worth something. A node marked local that reached the index is the exact failure the whole
// separation exists to prevent, so it is reported first and never downgraded to a warning.
const KNOWN_SCOPES = ["local", "public"];

export function checkBoundary({ nodes, trackedFiles, localIgnored }) {
  const violations = [];

  for (const node of nodes) {
    const scope = node.data.scope;
    // An unrecognised scope is treated as a violation here, not merely somewhere upstream: this
    // check exists to be trustworthy on its own, and a node with no meaningful scope has nothing
    // for the tracked/untracked rules below to evaluate, so it must be caught here rather than
    // silently passed through.
    if (!KNOWN_SCOPES.includes(scope)) {
      violations.push(`${node.file}: unrecognised scope "${scope}"`);
      continue;
    }
    const isTracked = trackedFiles.has(node.file);
    if (scope === "local" && isTracked) {
      violations.push(`${node.file}: declared scope "local" but the file is tracked by git`);
    }
    if (scope === "public" && !isTracked) {
      violations.push(`${node.file}: declared scope "public" but the file is not tracked by git`);
    }
  }

  if (!localIgnored) {
    violations.push('local/ is not covered by .gitignore: add "/local/" to it');
  }

  return violations;
}
