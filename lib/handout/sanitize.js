export function playerSafe(value, { denyKeys = ["secret", "secrets_and_clues"] } = {}) {
  const deny = new Set(denyKeys);
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        // Vista-player: rimuove deny list esplicita + convenzioni DM/GM
        // (suffisso _dm/_gm, prefisso dm_/gm_).
        if (deny.has(k) || /^(dm_|gm_)/.test(k) || /(_dm|_gm)$/.test(k)) continue;
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(value);
}
