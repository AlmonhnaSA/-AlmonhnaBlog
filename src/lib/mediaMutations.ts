import { supabase } from "@/integrations/supabase/client";

export type MediaTable = "articles" | "news" | "products" | "store_products" | "profiles" | "timelines" | "audio_episodes";
const revisions = new Map<string, string>();
export function rememberMediaRevision(table: MediaTable, row: { id: string; updated_at?: string }) {
  if (row.updated_at) revisions.set(`${table}:${row.id}`, row.updated_at);
}
export async function mediaCapabilities(): Promise<boolean> {
  // No environment edits and no automatic switch on a missing staged function.
  const { data, error } = await supabase.functions.invoke("media-lifecycle", { body: { action: "capabilities" } });
  return !error && data?.version === 1 && data?.mutations === true;
}
export async function saveMediaRecord(table: MediaTable, id: string | undefined, values: Record<string, unknown>, children: Record<string, unknown[]> = {}) {
  const { data, error } = await supabase.functions.invoke("media-lifecycle", { body: { action: "save", table, id, values, children, expectedUpdatedAt: id ? revisions.get(`${table}:${id}`) : undefined } });
  if (error || !data?.row?.id) throw new Error("تعذّر تأكيد الحفظ الآمن؛ لم تُحذف الملفات القديمة.");
  rememberMediaRevision(table, data.row);
  return data.row as Record<string, unknown> & { id: string };
}
export async function deleteMediaRecord(table: MediaTable, id: string) {
  // Fetching a revision here does not authorize deletion; the RPC checks RLS.
  const { data: row, error: readError } = await supabase.from(table).select("id,updated_at").eq("id", id).single();
  if (readError || !row) return { error: new Error("تعذّر التحقق من العنصر") };
  const { data, error } = await supabase.functions.invoke("media-lifecycle", { body: { action: "delete", table, id, expectedUpdatedAt: row.updated_at } });
  return { error: error || (!data?.deleted ? new Error("الحذف الآمن غير مفعّل؛ لم يُحذف العنصر أو ملفاته.") : null) };
}