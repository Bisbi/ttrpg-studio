const key = (e) => `${e.source}|${e.type}|${e.target}`;

export function neighbors(edges, node) {
  return edges.filter((e) => e.source === node || e.target === node);
}

export function outgoing(edges, node, type) {
  return edges.filter((e) => e.source === node && (type ? e.type === type : true));
}

export function mergeEdges(existing, incoming) {
  const seen = new Set(existing.map(key));
  const out = [...existing];
  for (const e of incoming) {
    if (!seen.has(key(e))) {
      seen.add(key(e));
      out.push(e);
    }
  }
  return out;
}
