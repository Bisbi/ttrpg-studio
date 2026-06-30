import { XP_THRESHOLDS, multiplierForCount } from "./thresholds.js";

export function partyBudget(levels) {
  const total = { easy: 0, medium: 0, hard: 0, deadly: 0 };
  for (const lvl of levels) {
    const t = XP_THRESHOLDS[lvl];
    if (!t) throw new Error(`Livello non valido: ${lvl} (atteso 1..20).`);
    total.easy += t.easy;
    total.medium += t.medium;
    total.hard += t.hard;
    total.deadly += t.deadly;
  }
  return total;
}

export function adjustedXp(xpList) {
  const sum = xpList.reduce((a, b) => a + b, 0);
  return sum * multiplierForCount(xpList.length);
}
