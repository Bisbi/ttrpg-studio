import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function resolveVoice(env = {}) {
  if (env.VOICE_PATH && existsSync(env.VOICE_PATH)) {
    return { path: env.VOICE_PATH, source: "VOICE_PATH" };
  }
  if (env.SETTING_PATH) {
    const p = join(env.SETTING_PATH, "voice-profile.md");
    if (existsSync(p)) return { path: p, source: "SETTING_PATH" };
  }
  return null;
}

export function loadVoice(env = {}) {
  const r = resolveVoice(env);
  if (!r) return null;
  return readFileSync(r.path, "utf8");
}
