import { ToolError, CODES } from "../common/errors.js";

export async function apiGenerate({ prompt, url, key, size = "1024x1536" }, { fetchImpl } = {}) {
  const doFetch = fetchImpl ?? fetch;
  const headers = { "content-type": "application/json" };
  if (key) headers.authorization = `Bearer ${key}`;
  let res;
  try {
    res = await doFetch(url, { method: "POST", headers, body: JSON.stringify({ prompt, size }) });
  } catch (e) {
    throw new ToolError(CODES.INTERNAL, `image-gen API irraggiungibile: ${e.message}`, true);
  }
  if (!res.ok) {
    throw new ToolError(CODES.INTERNAL, `image-gen API ha risposto ${res.status}.`, true);
  }
  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new ToolError(CODES.INTERNAL, `image-gen API: risposta non-JSON (${e.message})`, true);
  }
  const b64 = json?.b64_json ?? json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new ToolError(CODES.INVALID_INPUT, "Risposta image-gen senza campo b64_json riconoscibile.", false);
  }
  return Buffer.from(b64, "base64");
}
