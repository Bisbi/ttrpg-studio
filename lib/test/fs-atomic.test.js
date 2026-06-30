import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSafe } from "../common/fs-atomic.js";
import { ToolError } from "../common/errors.js";

function tmp() { return mkdtempSync(join(tmpdir(), "fsa-")); }

describe("writeFileSafe", () => {
  it("crea un nuovo file e le cartelle intermedie", () => {
    const dir = tmp();
    const p = join(dir, "a", "b", "f.md");
    const r = writeFileSafe(p, "ciao", {});
    expect(r.action).toBe("created");
    expect(readFileSync(p, "utf8")).toBe("ciao");
  });
  it("policy error: collisione lancia ToolError", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    writeFileSafe(p, "uno", {});
    expect(() => writeFileSafe(p, "due", { policy: "error" })).toThrow(ToolError);
  });
  it("policy skip: non sovrascrive", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    writeFileSafe(p, "uno", {});
    const r = writeFileSafe(p, "due", { policy: "skip" });
    expect(r.action).toBe("skipped");
    expect(readFileSync(p, "utf8")).toBe("uno");
  });
  it("policy overwrite: riscrive", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    writeFileSafe(p, "uno", {});
    const r = writeFileSafe(p, "due", { policy: "overwrite" });
    expect(r.action).toBe("overwritten");
    expect(readFileSync(p, "utf8")).toBe("due");
  });
  it("policy append: accoda", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    writeFileSafe(p, "uno", {});
    const r = writeFileSafe(p, "\ndue", { policy: "append" });
    expect(r.action).toBe("appended");
    expect(readFileSync(p, "utf8")).toBe("uno\ndue");
  });
  it("dryRun: non scrive e ritorna il diff", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    const r = writeFileSafe(p, "nuovo", { dryRun: true });
    expect(r.action).toBe("created");
    expect(r.diff).toContain("+nuovo");
    expect(existsSync(p)).toBe(false);
  });
});
