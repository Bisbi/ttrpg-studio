import { describe, it, expect } from "vitest";
import { apiGenerate } from "../image/api-provider.js";
import { ToolError } from "../common/errors.js";

function fetchOk(json) {
  return async () => ({ ok: true, status: 200, json: async () => json });
}

describe("apiGenerate", () => {
  it("decodifica b64_json da data[0]", async () => {
    const b64 = Buffer.from("PNGDATA").toString("base64");
    const buf = await apiGenerate(
      { prompt: "spada", url: "https://x", key: "k" },
      { fetchImpl: fetchOk({ data: [{ b64_json: b64 }] }) }
    );
    expect(buf.toString()).toBe("PNGDATA");
  });
  it("accetta b64_json top-level", async () => {
    const b64 = Buffer.from("IMG").toString("base64");
    const buf = await apiGenerate({ prompt: "x", url: "u" }, { fetchImpl: fetchOk({ b64_json: b64 }) });
    expect(buf.toString()).toBe("IMG");
  });
  it("errore su risposta non ok", async () => {
    const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) });
    await expect(apiGenerate({ prompt: "x", url: "u" }, { fetchImpl })).rejects.toThrow(ToolError);
  });
  it("errore su formato non riconosciuto", async () => {
    await expect(apiGenerate({ prompt: "x", url: "u" }, { fetchImpl: fetchOk({ nope: 1 }) })).rejects.toThrow(ToolError);
  });
});
