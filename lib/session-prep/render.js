export function renderOnePager(op, title) {
  const list = (arr) => (arr.length ? arr.map((x) => `- ${x}`).join("\n") : "- —");
  const monsters = op.readyMonsters.length
    ? op.readyMonsters.map((m) => `- ${m.id} (${m.role})`).join("\n")
    : "- —";
  const loot = [
    ...(op.loot?.items ?? []).map((i) => `- ${typeof i === "string" ? i : i.name}`),
    ...(op.loot?.nonItem ?? []).map((x) => `- ${x}`),
  ].join("\n") || "- —";
  return `# ${title} — Session Prep

## Strong start
${op.strongStart || "—"}

## 3 scene probabili
${list(op.scenes)}

## Mostri pronti
${monsters}

## 5 nomi PNG di riserva
${list(op.backupNpcNames)}

## 3 complicazioni
${list(op.complications)}

## Loot
${loot}
`;
}
