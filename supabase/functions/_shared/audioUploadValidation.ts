// Shared rules for R2 audio uploads (used by the edge function and tests).
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export const UPLOAD_PREFIX = "episodes/uploads/";
export const PUBLIC_AUDIO_BASE = "https://audio.almonhna.sa";
export const ALLOWED_AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
};

export type SignInput = { contentType: unknown; size: unknown };

export function validateSignInput(input: SignInput): { ok: true; contentType: string; size: number; ext: string } | { ok: false; error: string } {
  const contentType = typeof input.contentType === "string" ? input.contentType.toLowerCase().split(";")[0].trim() : "";
  const ext = ALLOWED_AUDIO_TYPES[contentType];
  if (!ext) return { ok: false, error: "unsupported_type" };
  const size = Number(input.size);
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: "invalid_size" };
  if (size > MAX_AUDIO_BYTES) return { ok: false, error: "too_large" };
  return { ok: true, contentType, size, ext };
}

export function buildUploadKey(userId: string, ext: string, now = Date.now(), rand = crypto.randomUUID().slice(0, 8)): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9-]/g, "");
  return `${UPLOAD_PREFIX}${safeUser}/${now}-${rand}.${ext}`;
}

/** Only keys created by this uploader may be verified or deleted. */
export function isManagedKey(key: unknown): key is string {
  return typeof key === "string" && key.startsWith(UPLOAD_PREFIX) && !key.includes("..") && /^[a-zA-Z0-9/._-]+$/.test(key);
}

export function publicUrlFor(key: string): string {
  return `${PUBLIC_AUDIO_BASE}/${key}`;
}

export function keyFromPublicUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith(PUBLIC_AUDIO_BASE + "/")) return null;
  return url.slice(PUBLIC_AUDIO_BASE.length + 1).split(/[?#]/)[0];
}
