// Turns a display name into a stable, filesystem-safe identifier.
// Diacritics are decomposed and dropped rather than transliterated, so that names differing only by
// accent collapse to the same slug instead of producing two records that look like duplicates.
export function slugify(name) {
  return String(name)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")  // drop the combining marks left by decomposition
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")      // everything else becomes the separator
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
