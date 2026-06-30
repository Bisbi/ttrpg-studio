import { ToolError, CODES } from "../common/errors.js";

// Provider best-effort: pilota un generatore web. Fragile, non testato in CI.
// Il `pilot` di default usa Playwright (package render/) e va fornito dal chiamante
// in produzione; nei test è iniettato.
export async function browserGenerate({ url, prompt, selector = "img" }, { pilot } = {}) {
  if (!url || !prompt) {
    throw new ToolError(CODES.INVALID_INPUT, "browser-provider richiede url e prompt.", false);
  }
  if (typeof pilot !== "function") {
    throw new ToolError(CODES.INVALID_INPUT, "Nessun pilot fornito al browser-provider.", false);
  }
  return pilot({ url, prompt, selector });
}
