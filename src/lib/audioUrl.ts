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

/**
 * On the first load error of a mapped link, switches the element back to the
 * original stored link exactly once, resuming playback only if it was wanted.
 * Returns true when it switched (the error should be ignored by callers).
 */
export function switchToOriginalOnce(audio: HTMLAudioElement, original: string | null | undefined, wantPlay: boolean): boolean {
  const target = original || "";
  if (!target || audio.dataset.audioFallback === "1" || audio.src === target) return false;
  audio.dataset.audioFallback = "1";
  const rate = audio.playbackRate;
  audio.src = target;
  audio.load();
  audio.playbackRate = rate;
  if (wantPlay) audio.play().catch(() => {});
  return true;
}

/** True when a rejected play() was only interrupted by the one-time switch. */
export function isFallbackInterruption(audio: HTMLAudioElement | null): boolean {
  return !!audio && audio.dataset.audioFallback === "1" && !audio.error;
}
