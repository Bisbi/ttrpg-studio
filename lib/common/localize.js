// Picks the display text for a field that may be a plain string or a { lang: text } map.
// Falls back to English then Italian when the requested language is missing, and to an empty
// string rather than undefined, so callers can always render the result without a null check.
export function localizeField(value, lang = "it") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value[lang] ?? value.en ?? value.it ?? "";
  }
  return "";
}
