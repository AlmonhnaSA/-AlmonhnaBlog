import { supabase } from "@/integrations/supabase/client";

export const normalizeColumnName = (name: string) =>
  name.normalize("NFKC").replace(/[\u064B-\u065F\u0670\u0640]/g, "").trim();

let cached: Promise<string[]> | null = null;

/** Product ids of the «الصورة» and «مقتبس» columns, whose articles stay only on their column pages. */
export const getVisualColumnIds = () => {
  cached ??= (async () => {
    const { data } = await supabase.from("products").select("id, name");
    return (data || []).filter((p) => ["الصورة", "مقتبس"].includes(normalizeColumnName(p.name))).map((p) => p.id);
  })();
  return cached;
};

/** PostgREST filter that keeps articles outside the visual columns. */
export const excludeVisualColumnsFilter = (ids: string[]) =>
  ids.length ? `product_id.is.null,product_id.not.in.(${ids.join(",")})` : null;
