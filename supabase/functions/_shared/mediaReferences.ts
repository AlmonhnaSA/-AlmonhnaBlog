/** Pure matching: never makes network calls or grants permission to delete. */
export interface MediaIdentity { project: string; bucket: string; key: string }
export interface MediaReference { identity: MediaIdentity; location: string; confidence: "exact" | "possible" }
export const identityKey = (v: MediaIdentity) => `${v.project}/${v.bucket}/${v.key}`;
export const isAudio = (key: string, type = "") => /(^|\/)(audio|episodes)(\/|$)/i.test(key) || /^audio\//i.test(type) || /\.(mp3|m4a|aac|wav|ogg|opus|flac|aiff)(?:$|\?)/i.test(key);

export function decodeBounded(value: string): string {
  let out = value.replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16))).replace(/&amp;|&#38;|&#x26;/gi, "&").replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex, dec) => {
    const code = Number.parseInt(hex || dec, hex ? 16 : 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : "";
  }).replace(/\\\//g, "/");
  for (let i = 0; i < 3; i++) {
    try { const next = decodeURIComponent(out); if (next === out) break; out = next; } catch { break; }
  }
  return out;
}

export function parseMediaUrl(raw: string, project: string): MediaIdentity | null {
  try {
    // URL parser normalizes dot segments, so reject before parsing.
    const input = decodeBounded(raw);
    if (/(?:^|\/)\.{1,2}(?:\/|$)|[\u0000-\u001f\\]/.test(input)) return null;
    const url = new URL(input);
    if (url.protocol !== "https:" || url.hostname !== `${project}.supabase.co` || url.username || url.password || url.port) return null;
    const match = url.pathname.match(/^\/storage\/v1\/(?:object\/(?:public|sign|authenticated)|render\/image\/(?:public|sign|authenticated))\/([^/]+)\/(.+)$/);
    if (!match || !match[2] || match[2].includes("//")) return null;
    return { project, bucket: match[1], key: match[2] };
  } catch { return null; }
}

export function collectReferences(value: unknown, project: string, location = "root"): MediaReference[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => collectReferences(item, project, `${location}[${i}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => collectReferences(v, project, `${location}.${k}`));
  if (typeof value !== "string") return [];
  const text = decodeBounded(value);
  const direct = parseMediaUrl(text.trim(), project);
  if (direct) return [{ identity: direct, location, confidence: "exact" }];
  const out: MediaReference[] = [];
  for (const candidate of text.matchAll(/https:\/\/[^\s"'<>`]+/g)) {
    const identity = parseMediaUrl(candidate[0].replace(/[),;]+$/, ""), project);
    if (identity) out.push({ identity, location, confidence: "exact" });
  }
  return out;
}

export function embeddedBytes(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((sum, v) => sum + embeddedBytes(v), 0);
  if (value && typeof value === "object") return Object.values(value).reduce<number>((sum, v) => sum + embeddedBytes(v), 0);
  if (typeof value !== "string") return 0;
  return [...value.matchAll(/data:image\/[^;,]+;base64,([A-Za-z0-9+/=\r\n]+)/g)].reduce((sum, m) => {
    const data = m[1].replace(/\s/g, "");
    return sum + Math.max(0, Math.floor(data.length * 3 / 4) - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0));
  }, 0);
}

export interface CleanupEvidence {
  managed: boolean; audio: boolean; references: number; activeLease: boolean;
  completeScan: boolean; externalReviewed: boolean; state: string; saved: boolean;
}
export function cleanupBlockers(v: CleanupEvidence): string[] {
  const reasons: string[] = [];
  if (!v.managed) reasons.push("legacy_or_unregistered");
  if (v.audio) reasons.push("audio_excluded");
  if (v.references !== 0) reasons.push("referenced");
  if (v.activeLease) reasons.push("active_draft");
  if (!v.completeScan) reasons.push("incomplete_scan");
  if (!v.externalReviewed) reasons.push("external_use_unreviewed");
  if (v.state !== "ready") reasons.push("not_ready");
  if (!v.saved) reasons.push("save_not_confirmed");
  return reasons;
}