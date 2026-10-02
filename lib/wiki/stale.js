// Lists nodes whose covered paths changed after the node was last touched.
// This is a hint, never a verdict: a rename or a formatting sweep moves the date without invalidating
// anything the node says. That is why the result is reported for a human or an agent to judge, and
// why nothing here blocks a commit.
export function findStale(nodes, lastModified) {
  const out = [];
  for (const node of nodes) {
    const covers = Array.isArray(node.data.covers) ? node.data.covers : [];
    const nodeAt = node.data.timestamp;
    for (const path of covers) {
      const coveredAt = lastModified(path);
      if (!coveredAt || !nodeAt) continue;
      if (coveredAt > nodeAt) out.push({ file: node.file, path, nodeAt, coveredAt });
    }
  }
  return out;
}
