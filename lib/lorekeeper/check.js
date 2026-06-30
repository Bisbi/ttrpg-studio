const EXCLUSIVE = [["ostile", "alleata"]];

function pairKey(a, b) {
  return [a, b].sort().join("|");
}

export function checkCanon({ edges, knownIds }) {
  const known = new Set(knownIds);
  const discrepancies = [];

  // DANGLING_REF + SELF_LOOP
  for (const e of edges) {
    if (e.source === e.target) {
      discrepancies.push({ code: "SELF_LOOP", message: `Arco su sé stesso: ${e.source} --${e.type}--> ${e.target}`, nodes: [e.source] });
    }
    for (const node of [e.source, e.target]) {
      if (!known.has(node)) {
        discrepancies.push({ code: "DANGLING_REF", message: `Riferimento a id sconosciuto: ${node}`, nodes: [node] });
      }
    }
  }

  // CONTRADICTION: tipi mutuamente esclusivi sulla stessa coppia non orientata
  const byPair = new Map();
  for (const e of edges) {
    const k = pairKey(e.source, e.target);
    if (!byPair.has(k)) byPair.set(k, new Set());
    byPair.get(k).add(e.type);
  }
  for (const [k, types] of byPair) {
    for (const [x, y] of EXCLUSIVE) {
      if (types.has(x) && types.has(y)) {
        discrepancies.push({ code: "CONTRADICTION", message: `Coppia ${k} ha tipi mutuamente esclusivi: ${x} + ${y}`, nodes: k.split("|") });
      }
    }
  }

  return { discrepancies };
}
