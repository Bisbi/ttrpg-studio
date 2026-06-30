export function localizeField(value, lang = "it") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value[lang] ?? value.en ?? value.it ?? "";
  }
  return "";
}
