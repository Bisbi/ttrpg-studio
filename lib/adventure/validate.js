export const RULES = {
  SECRETS_MIN: 8,
  LOCATIONS_MIN: 3,
  LOCATIONS_MAX: 5,
  SENSORY_MIN: 3,
  HOOKS_MIN: 3,
  NPC_REQUIRED: ["name", "role", "voice", "wants", "secret"],
};

const TOP_FIELDS = [
  "title", "strong_start", "secrets_and_clues", "fantastic_locations",
  "npcs", "monsters", "encounters", "hooks", "consequences", "reward_loot",
];

export function validateAdventure(doc) {
  const issues = [];
  const add = (code, message) => issues.push({ code, message });
  const d = doc ?? {};

  for (const f of TOP_FIELDS) {
    if (d[f] === undefined || d[f] === null || d[f] === "") {
      add("MISSING_FIELD", `Campo obbligatorio mancante: ${f}`);
    }
  }

  if (Array.isArray(d.secrets_and_clues) && d.secrets_and_clues.length < RULES.SECRETS_MIN) {
    add("TOO_FEW_SECRETS", `Servono almeno ${RULES.SECRETS_MIN} voci in secrets_and_clues (trovate ${d.secrets_and_clues.length}).`);
  }

  if (Array.isArray(d.fantastic_locations)) {
    const n = d.fantastic_locations.length;
    if (n < RULES.LOCATIONS_MIN || n > RULES.LOCATIONS_MAX) {
      add("LOCATIONS_OUT_OF_RANGE", `fantastic_locations deve avere ${RULES.LOCATIONS_MIN}–${RULES.LOCATIONS_MAX} voci (trovate ${n}).`);
    }
    d.fantastic_locations.forEach((loc, i) => {
      const sensory = loc?.sensory;
      if (!Array.isArray(sensory) || sensory.length < RULES.SENSORY_MIN) {
        add("LOCATION_SENSORY", `Il luogo #${i + 1} (${loc?.name ?? "?"}) deve avere almeno ${RULES.SENSORY_MIN} dettagli sensoriali.`);
      }
    });
  }

  if (Array.isArray(d.hooks) && d.hooks.length < RULES.HOOKS_MIN) {
    add("TOO_FEW_HOOKS", `Servono almeno ${RULES.HOOKS_MIN} ganci (trovati ${d.hooks.length}).`);
  }

  if (Array.isArray(d.npcs)) {
    d.npcs.forEach((npc, i) => {
      for (const f of RULES.NPC_REQUIRED) {
        if (!npc || npc[f] === undefined || npc[f] === null || npc[f] === "") {
          add("NPC_FIELD", `Il PNG #${i + 1} (${npc?.name ?? "?"}) manca del campo "${f}".`);
        }
      }
    });
  }

  return { ok: issues.length === 0, issues };
}
