import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveWithin } from "../lib/pathsafe.js";
import { ToolError } from "../lib/errors.js";

describe("resolveWithin", () => {
  const root = mkdtempSync(join(tmpdir(), "root-"));
  writeFileSync(join(root, "ok.json"), "{}");

  it("risolve un file dentro la root", () => {
    expect(resolveWithin(root, "ok.json")).toBe(join(root, "ok.json"));
  });

  it("blocca il path traversal con ..", () => {
    expect(() => resolveWithin(root, "../../etc/passwd")).toThrow(ToolError);
  });

  it("blocca path assoluti fuori dalla root", () => {
    expect(() => resolveWithin(root, "/etc/passwd")).toThrow(ToolError);
  });
});
