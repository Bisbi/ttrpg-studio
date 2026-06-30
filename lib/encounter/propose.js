import { adjustedXp } from "./budget.js";

// v1: gruppi mono-tipo (n copie di uno stesso mostro). Le combinazioni multi-tipo
// sono backlog: vanno comunque validate a mano contro il budget restituito.
const MAX_COUNT = 30; // limite di sicurezza alla ricerca

export function proposeEncounters({ candidates, target, maxResults = 5 }) {
  const proposals = [];
  for (const c of candidates) {
    let best = 0;
    let bestXp = 0;
    for (let n = 1; n <= MAX_COUNT; n++) {
      const xp = adjustedXp(Array(n).fill(c.xp));
      if (xp <= target) {
        best = n;
        bestXp = xp;
      } else {
        break;
      }
    }
    if (best > 0) proposals.push({ id: c.id, name: c.name, count: best, adjustedXp: bestXp });
  }
  proposals.sort((a, b) => b.adjustedXp - a.adjustedXp);
  return proposals.slice(0, maxResults);
}
