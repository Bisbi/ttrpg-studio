import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveVoice, loadVoice } from "../voice/resolve.js";

describe("resolveVoice", () => {
  it("VOICE_PATH ha priorità", () => {
    const dir = mkdtempSync(join(tmpdir(), "v-"));
    const p = join(dir, "myvoice.md");
    writeFileSync(p, "# voce");
    expect(resolveVoice({ VOICE_PATH: p }).source).toBe("VOICE_PATH");
  });
  it("fallback a SETTING_PATH/voice-profile.md", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    writeFileSync(join(dir, "voice-profile.md"), "# voce");
    const r = resolveVoice({ SETTING_PATH: dir });
    expect(r.source).toBe("SETTING_PATH");
    expect(r.path).toBe(join(dir, "voice-profile.md"));
  });
  it("null se nessuna voce", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    expect(resolveVoice({ SETTING_PATH: dir })).toBe(null);
    expect(resolveVoice({})).toBe(null);
  });
});

describe("loadVoice", () => {
  it("ritorna il contenuto se presente", () => {
    const dir = mkdtempSync(join(tmpdir(), "v-"));
    const p = join(dir, "myvoice.md");
    writeFileSync(p, "# La mia voce\nFrasi brevi.");
    expect(loadVoice({ VOICE_PATH: p })).toContain("La mia voce");
  });
  it("null se assente", () => {
    expect(loadVoice({})).toBe(null);
  });
});
