// Compares the scope each node declares against what git actually tracks.
// The declaration alone protects nothing - it is an assertion, and this is the check that makes it
// worth something. A node marked local that reached the index is the exact failure the whole
// separation exists to prevent, so it is reported first and never downgraded to a warning.
export function checkBoundary({ nodes, trackedFiles, localIgnored }) {
  const violations = [];

  for (const node of nodes) {
    const isTracked = trackedFiles.has(node.file);
    if (node.data.scope === "local" && isTracked) {
      violations.push(`${node.file}: declared scope "local" but the file is tracked by git`);
    }
    if (node.data.scope === "public" && !isTracked) {
      violations.push(`${node.file}: declared scope "public" but the file is not tracked by git`);
    }
  }

  if (!localIgnored) {
    violations.push('local/ is not covered by .gitignore: add "/local/" to it');
  }

  return violations;
}
