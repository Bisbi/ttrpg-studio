import { z } from "zod";

export const LocalizableString = z.union([
  z.string(),
  z.object({ it: z.string().optional(), en: z.string().optional() }),
]);

export function localize(value, lang) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value[lang] ?? value.en ?? value.it ?? "";
  }
  return "";
}

export const EntryNode = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("text"), text: LocalizableString }),
    z.object({ type: z.literal("list"), items: z.array(EntryNode) }),
    z.object({
      type: z.literal("table"),
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    }),
    z.object({
      type: z.literal("entries"),
      name: LocalizableString.optional(),
      entries: z.array(EntryNode),
    }),
  ])
);

export const BaseRecord = z.object({
  id: z.string().min(1),
  name: LocalizableString,
  source: z.string().min(1),
  entries: z.array(EntryNode).optional(),
});
