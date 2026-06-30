export function extractOnePager(doc) {
  const d = doc ?? {};
  const scenes = (d.fantastic_locations ?? []).slice(0, 3).map((l) => l.name);
  const backupNpcNames = (d.npcs ?? []).slice(0, 5).map((n) => n.name);
  let complications = (d.consequences ?? []).map((c) => c.then).filter(Boolean).slice(0, 3);
  if (complications.length === 0) complications = (d.hooks ?? []).slice(0, 3);
  return {
    strongStart: d.strong_start ?? "",
    scenes,
    readyMonsters: d.monsters ?? [],
    backupNpcNames,
    complications,
    loot: d.reward_loot ?? { items: [], nonItem: [] },
  };
}
