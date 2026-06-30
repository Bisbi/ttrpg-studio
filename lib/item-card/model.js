import { localizeField } from "../common/localize.js";

export function cardModel(item, lang = "it") {
  const d = item ?? {};
  return {
    name: localizeField(d.name, lang),
    rarity: localizeField(d.rarity, lang),
    attunement: Boolean(d.attunement),
    description: localizeField(d.description ?? d.desc, lang),
    image: d.image ?? null,
  };
}
