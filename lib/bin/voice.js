#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { loadVoice } from "../voice/resolve.js";
import { createLogger } from "../common/logger.js";

export function runVoice(env = {}) {
  const voice = loadVoice(env);
  return { code: 0, voice };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const logger = createLogger(process.env);
  const { voice } = runVoice(process.env);
  if (voice) {
    process.stdout.write(voice);
  } else {
    logger.info("Nessun profilo voce personale. Imposta VOICE_PATH o crea SETTING_PATH/voice-profile.md (vedi /voice-profile).");
  }
}
