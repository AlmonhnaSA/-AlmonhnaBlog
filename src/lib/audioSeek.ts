/** Fraction (0..1) of a horizontal bar under the pointer, respecting RTL direction. */
export function pointerFraction(el: HTMLElement, clientX: number): number {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  const rtl = getComputedStyle(el).direction === "rtl";
  const raw = rtl ? (rect.right - clientX) / rect.width : (clientX - rect.left) / rect.width;
  return Math.min(1, Math.max(0, raw));
}

/** Moves playback to a fraction of the episode, loading metadata first if needed. */
export function seekToFraction(audio: HTMLAudioElement | null, fraction: number) {
  if (!audio) return;
  const apply = () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(audio.duration - 0.25, Math.max(0, fraction * audio.duration));
    }
  };
  if (Number.isFinite(audio.duration) && audio.duration > 0) return apply();
  audio.addEventListener("loadedmetadata", apply, { once: true });
  if (audio.preload === "none") audio.preload = "metadata";
  if (audio.readyState === 0) audio.load();
}

/** Pointer + keyboard handlers that make a progress bar act as a seek slider. */
export function seekBarHandlers(getAudio: () => HTMLAudioElement | null) {
  const seek = (e: React.PointerEvent<HTMLElement>) =>
    seekToFraction(getAudio(), pointerFraction(e.currentTarget, e.clientX));
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      seek(e);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) seek(e);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      const audio = getAudio();
      if (!audio || !Number.isFinite(audio.duration)) return;
      const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
      const fwd = rtl ? "ArrowLeft" : "ArrowRight";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === fwd) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
      else if (e.key === back) audio.currentTime = Math.max(0, audio.currentTime - 10);
      else return;
      e.preventDefault();
    },
  };
}
