import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runVoice } from "../bin/voice.js";

describe("runVoice", () => {
  it("ritorna il contenuto della voce se presente", () => {
    const dir = mkdtempSync(join(tmpdir(), "v-"));
    const p = join(dir, "voice.md");
    writeFileSync(p, "# Voce\nRitmo spezzato.");
    const r = runVoice({ VOICE_PATH: p });
    expect(r.code).toBe(0);
    expect(r.voice).toContain("Ritmo spezzato.");
  });
  it("voice null senza profilo", () => {
    const r = runVoice({});
    expect(r.code).toBe(0);
    expect(r.voice).toBe(null);
  });
});
