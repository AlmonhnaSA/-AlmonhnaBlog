import { supabase } from "@/integrations/supabase/client";

export type MediaTable = "articles" | "news" | "products" | "store_products" | "profiles" | "timelines" | "audio_episodes";
const revisions = new Map<string, string>();
let capability: Promise<boolean> | undefined;
let capabilityUntil = 0;
export function rememberMediaRevision(table: MediaTable, row: { id: string; updated_at?: string }) {
  if (row.updated_at) revisions.set(`${table}:${row.id}`, row.updated_at);
}
export async function mediaCapabilities(): Promise<boolean> {
  if (Date.now() > capabilityUntil) { capability = undefined; capabilityUntil = Date.now() + 30000; }
  capability ??= supabase.functions.invoke("media-lifecycle", { body: { action: "capabilities" } }).then(({ data, error }) => !error && data?.version === 1 && data?.mutations === true).catch(() => false);
  return capability;
}
export async function saveMediaRecord(table: MediaTable, id: string | undefined, values: Record<string, unknown>, children: Record<string, unknown[]> = {}) {
  if (!(await mediaCapabilities())) throw new Error("الحفظ الموحّد ينتظر تفعيل الخدمة بموافقة منفصلة.");
  const { data, error } = await supabase.functions.invoke("media-lifecycle", { body: { action: "save", table, id, values, children, expectedUpdatedAt: id ? revisions.get(`${table}:${id}`) : undefined } });
  if (error || !data?.row?.id) throw new Error("تعذّر تأكيد الحفظ الآمن؛ لم تُحذف الملفات القديمة.");
  rememberMediaRevision(table, data.row);
  return data.row as Record<string, unknown> & { id: string };
}
export async function deleteMediaRecord(table: MediaTable, id: string) {
  // Fetching a revision here does not authorize deletion; the RPC checks RLS.
  const { data: row, error: readError } = await supabase.from(table).select("id,updated_at").eq("id", id).single();
  if (readError || !row) return { error: new Error("تعذّر التحقق من العنصر") };
  if (!(await mediaCapabilities())) {
    // Compatibility mode: checked content-only delete, never file cleanup.
    const { data, error } = await supabase.from(table).delete().eq("id", id).eq("updated_at", row.updated_at).select("id").single();
    return { error: error || (!data ? new Error("تعذّر تأكيد حذف العنصر") : null) };
  }
  const { data, error } = await supabase.functions.invoke("media-lifecycle", { body: { action: "delete", table, id, expectedUpdatedAt: row.updated_at } });
  return { error: error || (!data?.deleted ? new Error("الحذف الآمن غير مفعّل؛ لم يُحذف العنصر أو ملفاته.") : null) };
}