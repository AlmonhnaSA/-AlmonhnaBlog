/**
 * Almonhna audio service — serves episode audio from R2 via the AUDIO_BUCKET binding.
 *
 * Request flow (GET):
 *  1. Edge cache (caches.default) is checked with the client's Range header.
 *     A cached full 200 object answers ranges as 206 directly — no R2 operation.
 *  2. On a miss, only the requested byte range is streamed from R2 (one Class B get,
 *     no head(), never buffered in memory).
 *  3. In the background (ctx.waitUntil) the full object is streamed into the edge
 *     cache once per isolate, so later requests and seeks are served from cache.
 *
 * Note: caches.default only stores data on a custom domain/route. On *.workers.dev
 * cache writes are no-ops, so every request reaches R2 (still correct, just uncached).
 * No R2 keys are used anywhere: the binding is the only access path.
 */

export interface R2ObjectLike {
  key?: string;
  size: number;
  httpEtag?: string;
  etag?: string;
  uploaded?: Date;
  httpMetadata?: { contentType?: string };
  range?: { offset?: number; length?: number; suffix?: number };
  body?: ReadableStream | null;
}

export type R2RangeOption = { offset: number; length?: number } | { suffix: number };

export interface R2BucketLike {
  head(key: string): Promise<R2ObjectLike | null>;
  get(key: string, options?: { range?: R2RangeOption }): Promise<R2ObjectLike | null>;
}

export interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export interface Env {
  AUDIO_BUCKET: R2BucketLike;
  /** Comma-separated list of allowed site origins (exact match). */
  ALLOWED_ORIGINS?: string;
  /** Only keys under this prefix may be served. */
  KEY_PREFIX?: string;
}

export interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}

const DEFAULT_ORIGINS = "https://www.almonhna.sa,https://almonhna.sa";
/** Browser keeps files a year: safe only because every upload gets a new, unique path. */
const BROWSER_CACHE = "public, max-age=31536000, immutable";
/** Edge copy expires after 7 days, so an overwritten key self-heals at the edge within a week. */
const EDGE_CACHE = "public, max-age=604800";
const MAX_EDGE_CACHE_BYTES = 200 * 1024 * 1024; // well under the 512 MB cache object limit
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

/** Per-isolate memory: resolved keys and in-flight cache fills (avoid repeat R2 work). */
const resolvedKeys = new Map<string, string>();
const filling = new Set<string>();

export type ParsedRange =
  | { kind: "none" }
  | { kind: "unsatisfiable" }
  | { kind: "ok"; option: R2RangeOption };

/**
 * Parses a single "bytes=" range without needing the object size.
 * Malformed or multi-range headers are ignored (full 200), as RFC 9110 allows;
 * only "bytes=-0" is unsatisfiable here — "start beyond end" is detected against the size.
 */
export function parseRange(header: string | null): ParsedRange {
  if (!header) return { kind: "none" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return { kind: "none" };
  if (m[1] === "") {
    const suffix = Number(m[2]);
    return suffix > 0 ? { kind: "ok", option: { suffix } } : { kind: "unsatisfiable" };
  }
  const start = Number(m[1]);
  if (m[2] === "") return { kind: "ok", option: { offset: start } };
  const end = Number(m[2]);
  if (end < start) return { kind: "none" };
  return { kind: "ok", option: { offset: start, length: end - start + 1 } };
}

/** Converts a request path to a safe object key, or null when not allowed. */
export function keyFromPath(pathname: string, prefix = "episodes/"): string | null {
  let key: string;
  try {
    key = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return null;
  }
  if (!key || key.includes("..") || key.includes("\\") || key.includes("//")) return null;
  if (!key.startsWith(prefix) || key.endsWith("/")) return null;
  const ext = key.split(".").pop()?.toLowerCase() || "";
  if (!MIME[ext]) return null; // audio files only
  return key;
}

/** Keys to try: as requested, then with/without the original "audio/" folder. */
function candidateKeys(key: string, prefix: string): string[] {
  const known = resolvedKeys.get(key);
  if (known) return [known];
  const rest = key.slice(prefix.length);
  const alt = rest.startsWith("audio/")
    ? `${prefix}${rest.slice("audio/".length)}`
    : `${prefix}audio/${rest}`;
  return [key, alt];
}

function corsHeaders(request: Request, env: Env): Headers {
  const h = new Headers();
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && allowed.includes(origin)) h.set("Access-Control-Allow-Origin", origin);
  h.set("Vary", "Origin");
  h.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Range, If-None-Match, If-Modified-Since, If-Range");
  h.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges, ETag, X-Audio-Cache");
  h.set("Access-Control-Max-Age", "86400");
  return h;
}

function objectHeaders(obj: R2ObjectLike, key: string): Headers {
  const h = new Headers();
  const ext = key.split(".").pop()?.toLowerCase() || "";
  h.set("Content-Type", obj.httpMetadata?.contentType || MIME[ext] || "application/octet-stream");
  h.set("Accept-Ranges", "bytes");
  h.set("Cache-Control", BROWSER_CACHE);
  const etag = obj.httpEtag || (obj.etag ? `"${obj.etag}"` : "");
  if (etag) h.set("ETag", etag);
  if (obj.uploaded) h.set("Last-Modified", obj.uploaded.toUTCString());
  return h;
}

function withCors(res: Response, cors: Headers, cacheState: string, headOnly = false): Response {
  const h = new Headers(res.headers);
  cors.forEach((v, k) => h.set(k, v));
  if (res.status === 200 || res.status === 206 || res.status === 304) h.set("Cache-Control", BROWSER_CACHE);
  h.set("X-Audio-Cache", cacheState);
  return new Response(headOnly ? null : res.body, { status: res.status, headers: h });
}

function plain(status: number, text: string, cors: Headers, extra?: Record<string, string>): Response {
  const h = new Headers(cors);
  h.set("Content-Type", "text/plain; charset=utf-8");
  h.set("Cache-Control", status === 404 ? "public, max-age=60" : "no-store");
  for (const [k, v] of Object.entries(extra || {})) h.set(k, v);
  return new Response(text, { status, headers: h });
}

function defaultCache(): CacheLike | null {
  const c = (globalThis as any).caches?.default;
  return c || null;
}

/**
 * Streams the full object into the edge cache with one R2 get.
 * Duplicate fills are reduced in two ways: an in-isolate Set (same isolate only) and a
 * cache.match() check first (sees fills already finished by other isolates in the same
 * data centre). Neither coordinates isolates globally, so a few concurrent first requests
 * can still each fill once; each fill costs one extra R2 read, never more.
 */
async function fillCache(cache: CacheLike, cacheKey: Request, env: Env, key: string, size: number) {
  if (size > MAX_EDGE_CACHE_BYTES || filling.has(cacheKey.url)) return;
  filling.add(cacheKey.url);
  try {
    if (await cache.match(cacheKey)) return;
    const obj = await env.AUDIO_BUCKET.get(key);
    if (!obj?.body) return;
    const h = objectHeaders(obj, key);
    h.set("Content-Length", String(obj.size));
    h.set("Cache-Control", EDGE_CACHE);
    await cache.put(cacheKey, new Response(obj.body, { status: 200, headers: h }));
  } catch (e) {
    console.error("edge cache fill failed", key, String(e));
  } finally {
    filling.delete(cacheKey.url);
  }
}

/** If-Range matches only an identical strong ETag or exact Last-Modified date. */
function ifRangeMatches(ifRange: string, meta: R2ObjectLike): boolean {
  const etag = meta.httpEtag || (meta.etag ? `"${meta.etag}"` : "");
  if (ifRange.startsWith('"') || ifRange.startsWith("W/")) return !!etag && ifRange === etag;
  return !!meta.uploaded && new Date(ifRange).getTime() === Math.floor(meta.uploaded.getTime() / 1000) * 1000;
}

export async function handleRequest(
  request: Request,
  env: Env,
  ctx?: Ctx,
  cache: CacheLike | null = defaultCache(),
): Promise<Response> {
  const cors = corsHeaders(request, env);
  const method = request.method;
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (method !== "GET" && method !== "HEAD") return plain(405, "Method Not Allowed", cors, { Allow: "GET, HEAD, OPTIONS" });

  const url = new URL(request.url);
  if (url.pathname === "/health") return plain(200, "ok", cors);

  const prefix = env.KEY_PREFIX || "episodes/";
  const requested = keyFromPath(url.pathname, prefix);
  if (!requested) return plain(404, "Not Found", cors);

  let range = parseRange(request.headers.get("Range"));
  if (range.kind === "unsatisfiable") return plain(416, "Range Not Satisfiable", cors);

  // Cache key: path only (no query, no Range) so all ranges share one cached object.
  // Uses the resolved R2 key when known, so /episodes/audio/x and /episodes/x share one entry.
  const canonical = resolvedKeys.get(requested) || requested;
  // Query strings are ignored. Replacing a file under the same path is NOT supported:
  // every update must be uploaded under a new, unique name (the site's uploader already does this).
  // The 7-day edge expiry is only a safety net, not an update mechanism.
  const cacheKey = new Request(`${url.origin}/${canonical}`, { method: "GET" });

  // 1) Edge cache: match() answers Range/If-None-Match from a cached full object.
  if (cache) {
    try {
      const matchHeaders = new Headers();
      // If-Range is evaluated here, not by the cache: a cached copy whose ETag/Last-Modified
      // differs from the client's validator must return the full file (200), never a 206.
      for (const k of ["Range", "If-None-Match", "If-Modified-Since"]) {
        const v = request.headers.get(k);
        if (v) matchHeaders.set(k, v);
      }
      let hit = await cache.match(new Request(cacheKey.url, { method: "GET", headers: matchHeaders }));
      const ifRangeHeader = request.headers.get("If-Range");
      if (hit && hit.status === 206 && ifRangeHeader) {
        const cachedMeta: R2ObjectLike = {
          size: 0,
          httpEtag: hit.headers.get("ETag") || undefined,
          uploaded: hit.headers.get("Last-Modified") ? new Date(hit.headers.get("Last-Modified") as string) : undefined,
        };
        if (!ifRangeMatches(ifRangeHeader, cachedMeta)) {
          hit.body?.cancel();
          matchHeaders.delete("Range");
          hit = await cache.match(new Request(cacheKey.url, { method: "GET", headers: matchHeaders }));
        }
      }
      if (hit) return withCors(hit, cors, "HIT", method === "HEAD");
    } catch (e) {
      console.error("edge cache match failed", String(e));
    }
  }

  // 2) HEAD on a miss: metadata only (one Class B head, no body transfer).
  if (method === "HEAD") {
    for (const k of candidateKeys(requested, prefix)) {
      const meta = await env.AUDIO_BUCKET.head(k);
      if (!meta) continue;
      resolvedKeys.set(requested, k);
      const h = objectHeaders(meta, k);
      h.set("Content-Length", String(meta.size));
      return withCors(new Response(null, { status: 200, headers: h }), cors, "MISS", true);
    }
    return plain(404, "Not Found", cors);
  }

  // 3) GET on a miss: stream only what was asked for.
  const ifRange = request.headers.get("If-Range");
  for (const k of candidateKeys(requested, prefix)) {
    if (ifRange && range.kind === "ok") {
      // Rare: client resumes with a validator. Check it before choosing 206 vs 200.
      const meta = await env.AUDIO_BUCKET.head(k);
      if (!meta) continue;
      if (!ifRangeMatches(ifRange, meta)) range = { kind: "none" };
    }
    let obj: R2ObjectLike | null;
    try {
      obj = await env.AUDIO_BUCKET.get(k, range.kind === "ok" ? { range: range.option } : undefined);
    } catch {
      // R2 rejects ranges beyond the end of the object.
      const meta = await env.AUDIO_BUCKET.head(k);
      if (!meta) continue;
      resolvedKeys.set(requested, k);
      return plain(416, "Range Not Satisfiable", cors, { "Content-Range": `bytes */${meta.size}` });
    }
    if (!obj) continue;
    resolvedKeys.set(requested, k);

    const h = objectHeaders(obj, k);
    let status = 200;
    const body = obj.body ?? null;

    if (range.kind === "ok") {
      const size = obj.size;
      let start: number;
      let length: number;
      if (obj.range && typeof obj.range.offset === "number") {
        start = obj.range.offset;
        length = obj.range.length ?? size - start;
      } else if (obj.range && typeof obj.range.suffix === "number") {
        length = Math.min(obj.range.suffix, size);
        start = size - length;
      } else {
        const o = range.option as any;
        start = "suffix" in o ? Math.max(0, size - o.suffix) : o.offset;
        length = "suffix" in o ? size - start : (o.length ?? size - start);
      }
      length = Math.min(length, size - start);
      if (start >= size || length <= 0) {
        body?.cancel();
        return plain(416, "Range Not Satisfiable", cors, { "Content-Range": `bytes */${size}` });
      }
      status = 206;
      h.set("Content-Range", `bytes ${start}-${start + length - 1}/${size}`);
      h.set("Content-Length", String(length));
    } else {
      h.set("Content-Length", String(obj.size));
    }
    // The client gets its bytes straight from R2; the cache fill is a separate background read
    // (no tee, so a slow listener never makes the Worker buffer the whole file).
    if (cache && ctx) ctx.waitUntil(fillCache(cache, cacheKey, env, k, obj.size));

    return withCors(new Response(body, { status, headers: h }), cors, "MISS");
  }

  return plain(404, "Not Found", cors);
}

export default {
  fetch: (request: Request, env: Env, ctx: Ctx) => handleRequest(request, env, ctx),
};
