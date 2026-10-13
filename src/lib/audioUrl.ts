/**
 * Maps a stored episode audio link to the R2 audio service when
 * VITE_AUDIO_BASE_URL is configured. Without it, links are returned unchanged,
 * so the current site keeps playing from the existing storage.
 */
const OLD_MARKER = "/storage/v1/object/public/images/audio/";

export function resolveAudioUrl(url: string | null | undefined, base?: string): string {
  const value = url || "";
  const service = (base ?? (import.meta as any).env?.VITE_AUDIO_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (!service || !value) return value;
  const at = value.indexOf(OLD_MARKER);
  if (at === -1) return value;
  const rest = value.slice(at + OLD_MARKER.length).split(/[?#]/)[0];
  if (!rest) return value;
  return `${service}/episodes/${rest}`;
}
