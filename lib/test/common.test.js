import { describe, it, expect, vi } from "vitest";
import { ToolError, CODES } from "../common/errors.js";
import { createLogger } from "../common/logger.js";

describe("ToolError", () => {
  it("serializza in {code,message,retriable}", () => {
    const e = new ToolError(CODES.COLLISION, "esiste già", false);
    expect(e.toJSON()).toEqual({ code: "COLLISION", message: "esiste già", retriable: false });
  });
});

describe("logger", () => {
  it("scrive su stderr, mai su stdout", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    createLogger({}).info("ciao");
    expect(err).toHaveBeenCalled();
    expect(out).not.toHaveBeenCalled();
    err.mockRestore(); out.mockRestore();
  });
  it("debug no-op senza TTRPG_DEBUG", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    createLogger({}).debug("x");
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
});
