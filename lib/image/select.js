export function selectProvider(env = {}) {
  if (env.IMAGE_API_URL) return "api";
  if (env.IMAGE_GEN_URL) return "browser";
  return null;
}
