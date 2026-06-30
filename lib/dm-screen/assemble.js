export function assembleScreen({ adventure = {}, monsters = [] } = {}) {
  const a = adventure;
  const panels = [
    { heading: "Strong start", items: [a.strong_start ?? ""] },
    { heading: "Incontri", items: (a.encounters ?? []).map((e) => e.name ?? "incontro") },
    { heading: "Mostri", items: monsters.map((m) => `${m.name ?? m.id} (${m.xp ?? "?"} XP)`) },
    { heading: "Ganci", items: (a.hooks ?? []).slice(0, 5) },
  ];
  return { title: a.title ?? "Schermo del Master", panels };
}
