/** Normalise Arabic text so search ignores diacritics, tatweel and alef/yaa/taa-marbuta variants. */
export const normalizeSearch = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/<[^>]+>/g, " ")
    .toLowerCase();

const collect = (v: unknown, out: string[], depth = 0) => {
  if (v == null || depth > 4) return;
  if (typeof v === "string" || typeof v === "number") out.push(String(v));
  else if (Array.isArray(v)) v.forEach((x) => collect(x, out, depth + 1));
  else if (typeof v === "object") Object.entries(v as Record<string, unknown>).forEach(([k, x]) => {
    if (!/(^id$|_id$|url$|_at$)/.test(k)) collect(x, out, depth + 1);
  });
};

/** Keep items whose text fields contain every word of the query. */
export function searchItems<T>(items: T[], query: string): T[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((item) => {
    const parts: string[] = [];
    collect(item, parts);
    const text = normalizeSearch(parts.join(" "));
    return words.every((w) => text.includes(w));
  });
}
