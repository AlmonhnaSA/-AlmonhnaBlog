/** Opt-in after migration verification. Old URLs remain the rollback source. */
export function resolveImageUrl(raw: string, imageBase?: string, sourceProject?: string): string {
  if (!imageBase || !sourceProject) return raw;
  try {
    const base = new URL(imageBase), url = new URL(raw);
    if (base.protocol !== "https:" || base.hostname === "audio.almonhna.sa" || base.pathname !== "/" || base.search || base.hash) return raw;
    if (url.hostname !== `${sourceProject}.supabase.co` || url.protocol !== "https:") return raw;
    const match = url.pathname.match(/^\/storage\/v1\/(?:object|render\/image)\/public\/(images|store-files)\/(.+)$/);
    if (!match || /\.(mp3|m4a|wav|ogg|pdf|zip)$/i.test(match[2])) return raw;
    return `${base.origin}/legacy/${match[1]}/${match[2]}`;
  } catch { return raw; }
}