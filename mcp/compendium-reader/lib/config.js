import { statSync } from "node:fs";

export function validateConfig(env = {}) {
  const dataPath = env.GAME_DATA_PATH;
  if (!dataPath) {
    throw new Error(
      "Config: GAME_DATA_PATH non impostata. Indica la cartella del tuo compendio " +
      "(es. ./examples/compendium-homebrew)."
    );
  }
  let st;
  try {
    st = statSync(dataPath);
  } catch {
    throw new Error(`Config: GAME_DATA_PATH non esiste o non è leggibile: ${dataPath}`);
  }
  if (!st.isDirectory()) {
    throw new Error(`Config: GAME_DATA_PATH non è una cartella: ${dataPath}`);
  }
  const lang = env.GAME_DATA_LANG ?? "it";
  if (lang !== "it" && lang !== "en") {
    throw new Error(`Config: GAME_DATA_LANG deve essere "it" o "en" (ricevuto: "${lang}").`);
  }
  return { dataPath, lang };
}
