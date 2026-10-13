/**
 * Almonhna audio service — serves episode audio from R2 through a bucket binding.
 * No R2 keys are used anywhere: the binding is the only access path.
 * Supports GET/HEAD, HTTP Range (seek), conditional requests and CORS.
 */

export interface R2ObjectLike {
  size: number;
  httpEtag?: string;
  etag?: string;
  uploaded?: Date;
  httpMetadata?: { contentType?: string };
  body?: ReadableStream | Uint8Array | ArrayBuffer | null;
}

export interface R2BucketLike {
  head(key: string): Promise<R2ObjectLike | null>;
  get(
    key: string,
    options?: { range?: { offset: number; length?: number } },
  ): Promise<R2ObjectLike | null>;
}

export interface Env {
  AUDIO_BUCKET: R2BucketLike;
  /** Comma-separated list of allowed site origins. */
  ALLOWED_ORIGINS?: string;
  /** Only keys under this prefix may be served. */
  KEY_PREFIX?: string;
}

const DEFAULT_ORIGINS = "https://www.almonhna.sa,https://almonhna.sa";
const MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  webm: "audio/webm",
  flac: "audio/flac",
};

export type ParsedRange =
  | { kind: "none" }
  | { kind: "invalid" }
  | { kind: "ok"; start: number; end: number };

/** Parses a single-range "bytes=" header against a known size. */
export function parseRange(header: string | null, size: number): ParsedRange {
  if (!header) return { kind: "none" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return { kind: "invalid" };
  let start: number;
  let end: number;
  if (m[1] === "") {
    const suffix = Number(m[2]);
    if (suffix === 0) return { kind: "invalid" };
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return { kind: "invalid" };
  return { kind: "ok", start, end };
}

function corsHeaders(request: Request, env: Env): Headers {
  const h = new Headers();
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && (allowed.includes("*") || allowed.includes(origin))) {
    h.set("Access-Control-Allow-Origin", origin);
    h.set("Vary", "Origin");
  }
  h.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Range, If-None-Match, If-Modified-Since");
  h.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges, ETag");
  h.set("Access-Control-Max-Age", "86400");
  return h;
}

/** Converts a request path to a safe object key, or null when not allowed. */
export function keyFromPath(pathname: string, prefix = "episodes/"): string | null {
  let key: string;
  try {
    key = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return null;
  }
  if (!key || key.includes("..") || key.includes("\\") || key.endsWith("/")) return null;
  if (!key.startsWith(prefix)) return null;
  return key;
}

/** Keys to try: as requested, then with the original "audio/" folder kept. */
function candidateKeys(key: string, prefix: string): string[] {
  const rest = key.slice(prefix.length);
  const list = [key];
  if (!rest.startsWith("audio/")) list.push(`${prefix}audio/${rest}`);
  else list.push(`${prefix}${rest.slice("audio/".length)}`);
  return list;
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(request, env);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "GET" && request.method !== "HEAD") {
    cors.set("Allow", "GET, HEAD, OPTIONS");
    return new Response("Method Not Allowed", { status: 405, headers: cors });
  }

  const prefix = env.KEY_PREFIX || "episodes/";
  const url = new URL(request.url);
  if (url.pathname === "/health") return new Response("ok", { headers: cors });

  const requested = keyFromPath(url.pathname, prefix);
  if (!requested) return new Response("Not Found", { status: 404, headers: cors });

  let key = "";
  let meta: R2ObjectLike | null = null;
  for (const k of candidateKeys(requested, prefix)) {
    meta = await env.AUDIO_BUCKET.head(k);
    if (meta) {
      key = k;
      break;
    }
  }
  if (!meta) return new Response("Not Found", { status: 404, headers: cors });

  const size = meta.size;
  const etag = meta.httpEtag || (meta.etag ? `"${meta.etag}"` : undefined);
  const ext = key.split(".").pop()?.toLowerCase() || "";
  const headers = cors;
  headers.set("Content-Type", meta.httpMetadata?.contentType || MIME[ext] || "application/octet-stream");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (etag) headers.set("ETag", etag);
  if (meta.uploaded) headers.set("Last-Modified", meta.uploaded.toUTCString());

  const inm = request.headers.get("If-None-Match");
  if (etag && inm && inm.split(",").map((s) => s.trim()).includes(etag)) {
    return new Response(null, { status: 304, headers });
  }

  // If-Range: only honour the range when the validator still matches.
  const ifRange = request.headers.get("If-Range");
  const rangeHeader = ifRange && etag && ifRange !== etag ? null : request.headers.get("Range");
  const range = parseRange(rangeHeader, size);

  if (range.kind === "invalid") {
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  if (range.kind === "ok") {
    const length = range.end - range.start + 1;
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    headers.set("Content-Length", String(length));
    if (request.method === "HEAD") return new Response(null, { status: 206, headers });
    const obj = await env.AUDIO_BUCKET.get(key, { range: { offset: range.start, length } });
    if (!obj) return new Response("Not Found", { status: 404, headers: corsHeaders(request, env) });
    return new Response(obj.body as BodyInit, { status: 206, headers });
  }

  headers.set("Content-Length", String(size));
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  const obj = await env.AUDIO_BUCKET.get(key);
  if (!obj) return new Response("Not Found", { status: 404, headers: corsHeaders(request, env) });
  return new Response(obj.body as BodyInit, { status: 200, headers });
}

export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
};
