const EDGE_RE = /^(.+?)\s*--(.+?)-->\s*(.+?)\s*$/;

export function parseRelations(markdown) {
  const lines = String(markdown).split("\n");
  const start = lines.findIndex((l) => l.trim() === "```relations");
  if (start === -1) return [];
  const edges = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "```") break;
    if (!line || line.startsWith("#")) continue;
    const m = line.match(EDGE_RE);
    if (m) edges.push({ source: m[1].trim(), type: m[2].trim(), target: m[3].trim() });
  }
  return edges;
}

export function serializeRelations(edges) {
  const sorted = [...edges].sort(
    (a, b) =>
      a.source.localeCompare(b.source) ||
      a.type.localeCompare(b.type) ||
      a.target.localeCompare(b.target)
  );
  const body = sorted.map((e) => `${e.source} --${e.type}--> ${e.target}`).join("\n");
  return "```relations\n" + body + "\n```\n";
}
