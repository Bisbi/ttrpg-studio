import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const bin = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "encounter.js");

function run(args, input) {
  return spawnSync(process.execPath, [bin, ...args], { input: input ?? "", encoding: "utf8" });
}

describe("encounter CLI (main, fix review)", () => {
  it("JSON malformato su stdin → exit 1 + ERROR, niente stack trace", () => {
    const r = run(["--levels", "1,1"], "{bad json");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("[ttrpg-studio] ERROR");
    expect(r.stderr).not.toContain("at JSON.parse");
  });
  it("--levels senza valore → exit 1 + messaggio", () => {
    const r = run(["--levels"], "[]");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("[ttrpg-studio] ERROR");
  });
  it("input valido → exit 0 + JSON con budget", () => {
    const r = run(["--levels", "1,1", "--difficulty", "hard"], "[]");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("budget");
  });
});
