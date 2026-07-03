import { statSync } from "node:fs";

export function validateConfig(env = {}) {
  const raw = env.GAME_DATA_PATH;
  if (!raw) {
    throw new Error(
      "Config: GAME_DATA_PATH non impostata. Indica una o più cartelle del compendio " +
      "separate da ';' (es. ./ref;./setting/compendium)."
    );
  }
  const dataPaths = raw.split(";").map((s) => s.trim()).filter(Boolean);
  if (dataPaths.length === 0) {
    throw new Error("Config: GAME_DATA_PATH vuota dopo il parsing.");
  }
  for (const p of dataPaths) {
    let st;
    try {
      st = statSync(p);
    } catch {
      throw new Error(`Config: percorso GAME_DATA_PATH non esiste o non è leggibile: ${p}`);
    }
    if (!st.isDirectory()) {
      throw new Error(`Config: GAME_DATA_PATH non è una cartella: ${p}`);
    }
  }
  const lang = env.GAME_DATA_LANG ?? "it";
  if (lang !== "it" && lang !== "en") {
    throw new Error(`Config: GAME_DATA_LANG deve essere "it" o "en" (ricevuto: "${lang}").`);
  }
  return { dataPaths, lang };
}
