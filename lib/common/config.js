import { statSync } from "node:fs";

export function validateSettingConfig(env = {}) {
  const settingPath = env.SETTING_PATH;
  if (!settingPath) {
    throw new Error(
      "Config: SETTING_PATH non impostata. Indica la cartella della Setting Bible " +
      "(es. ./setting)."
    );
  }
  let st;
  try {
    st = statSync(settingPath);
  } catch {
    throw new Error(`Config: SETTING_PATH non esiste o non è leggibile: ${settingPath}`);
  }
  if (!st.isDirectory()) {
    throw new Error(`Config: SETTING_PATH non è una cartella: ${settingPath}`);
  }
  const lang = env.GAME_DATA_LANG ?? "it";
  if (lang !== "it" && lang !== "en") {
    throw new Error(`Config: GAME_DATA_LANG deve essere "it" o "en" (ricevuto: "${lang}").`);
  }
  return { settingPath, lang };
}
