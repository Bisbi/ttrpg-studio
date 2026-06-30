export function playerSafe(value, { denyKeys = ["secret", "secrets_and_clues"] } = {}) {
  const deny = new Set(denyKeys);
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        if (deny.has(k) || k.endsWith("_dm")) continue;
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(value);
}
