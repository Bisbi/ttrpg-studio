export function slugify(name) {
  return String(name)
    .normalize("NFKD")               // separa i diacritici
    .replace(/[̀-ͯ]/g, "") // rimuove i segni diacritici combinanti
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")     // tutto il resto → separatore
    .replace(/-+/g, "-")             // niente trattini doppi
    .replace(/^-|-$/g, "");          // niente trattini ai bordi
}
