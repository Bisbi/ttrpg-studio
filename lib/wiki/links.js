// Collects the relative markdown links a wiki node points at, so that a broken cross-reference fails
// the validation run instead of quietly rotting. Absolute URLs are out of scope: nothing here can
// verify that a remote page still exists.
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function extractLinks(body) {
  const out = [];
  for (const m of String(body).matchAll(LINK)) {
    const target = m[1];
    if (target.startsWith("#") || SCHEME.test(target)) continue;
    const clean = target.split("#")[0];
    if (clean !== "" && !out.includes(clean)) out.push(clean);
  }
  return out;
}
