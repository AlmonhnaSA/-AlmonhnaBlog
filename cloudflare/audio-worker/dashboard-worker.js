// Almonhna audio Worker v2 — paste into the Cloudflare dashboard editor.
// Needs an R2 bucket binding named AUDIO_BUCKET -> almonhna-audio.
// src/index.ts
var DEFAULT_ORIGINS = "https://www.almonhna.sa,https://almonhna.sa";
var MAX_EDGE_CACHE_BYTES = 200 * 1024 * 1024;
var MIME = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  webm: "audio/webm",
  flac: "audio/flac"
};
var resolvedKeys = new Map;
var filling = new Set;
function parseRange(header) {
  if (!header)
    return { kind: "none" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || m[1] === "" && m[2] === "")
    return { kind: "invalid" };
  if (m[1] === "") {
    const suffix = Number(m[2]);
    return suffix > 0 ? { kind: "ok", option: { suffix } } : { kind: "invalid" };
  }
  const start = Number(m[1]);
  if (m[2] === "")
    return { kind: "ok", option: { offset: start } };
  const end = Number(m[2]);
  if (end < start)
    return { kind: "invalid" };
  return { kind: "ok", option: { offset: start, length: end - start + 1 } };
}
function keyFromPath(pathname, prefix = "episodes/") {
  let key;
  try {
    key = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return null;
  }
  if (!key || key.includes("..") || key.includes("\\") || key.includes("//"))
    return null;
  if (!key.startsWith(prefix) || key.endsWith("/"))
    return null;
  const ext = key.split(".").pop()?.toLowerCase() || "";
  if (!MIME[ext])
    return null;
  return key;
}
function candidateKeys(key, prefix) {
  const known = resolvedKeys.get(key);
  if (known)
    return [known];
  const rest = key.slice(prefix.length);
  const alt = rest.startsWith("audio/") ? `${prefix}${rest.slice("audio/".length)}` : `${prefix}audio/${rest}`;
  return [key, alt];
}
function corsHeaders(request, env) {
  const h = new Headers;
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",").map((s) => s.trim()).filter(Boolean);
  if (origin && allowed.includes(origin))
    h.set("Access-Control-Allow-Origin", origin);
  h.set("Vary", "Origin");
  h.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Range, If-None-Match, If-Modified-Since, If-Range");
  h.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges, ETag, X-Audio-Cache");
  h.set("Access-Control-Max-Age", "86400");
  return h;
}
function objectHeaders(obj, key) {
  const h = new Headers;
  const ext = key.split(".").pop()?.toLowerCase() || "";
  h.set("Content-Type", obj.httpMetadata?.contentType || MIME[ext] || "application/octet-stream");
  h.set("Accept-Ranges", "bytes");
  h.set("Cache-Control", "public, max-age=31536000, immutable");
  const etag = obj.httpEtag || (obj.etag ? `"${obj.etag}"` : "");
  if (etag)
    h.set("ETag", etag);
  if (obj.uploaded)
    h.set("Last-Modified", obj.uploaded.toUTCString());
  return h;
}
function withCors(res, cors, cacheState, headOnly = false) {
  const h = new Headers(res.headers);
  cors.forEach((v, k) => h.set(k, v));
  h.set("X-Audio-Cache", cacheState);
  return new Response(headOnly ? null : res.body, { status: res.status, headers: h });
}
function plain(status, text, cors, extra) {
  const h = new Headers(cors);
  h.set("Content-Type", "text/plain; charset=utf-8");
  h.set("Cache-Control", status === 404 ? "public, max-age=60" : "no-store");
  for (const [k, v] of Object.entries(extra || {}))
    h.set(k, v);
  return new Response(text, { status, headers: h });
}
function defaultCache() {
  const c = globalThis.caches?.default;
  return c || null;
}
async function fillCache(cache, cacheKey, env, key, body, meta) {
  if (filling.has(cacheKey.url)) {
    body?.cancel();
    return;
  }
  filling.add(cacheKey.url);
  try {
    let obj = meta && body ? { ...meta, body } : await env.AUDIO_BUCKET.get(key);
    if (!obj?.body || obj.size > MAX_EDGE_CACHE_BYTES) {
      obj?.body?.cancel();
      return;
    }
    const h = objectHeaders(obj, key);
    h.set("Content-Length", String(obj.size));
    await cache.put(cacheKey, new Response(obj.body, { status: 200, headers: h }));
  } catch (e) {
    console.error("edge cache fill failed", key, String(e));
  } finally {
    filling.delete(cacheKey.url);
  }
}
async function handleRequest(request, env, ctx, cache = defaultCache()) {
  const cors = corsHeaders(request, env);
  const method = request.method;
  if (method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  if (method !== "GET" && method !== "HEAD")
    return plain(405, "Method Not Allowed", cors, { Allow: "GET, HEAD, OPTIONS" });
  const url = new URL(request.url);
  if (url.pathname === "/health")
    return plain(200, "ok", cors);
  const prefix = env.KEY_PREFIX || "episodes/";
  const requested = keyFromPath(url.pathname, prefix);
  if (!requested)
    return plain(404, "Not Found", cors);
  const range = parseRange(request.headers.get("Range"));
  if (range.kind === "invalid")
    return plain(416, "Range Not Satisfiable", cors);
  const canonical = resolvedKeys.get(requested) || requested;
  const cacheKey = new Request(`${url.origin}/${canonical}`, { method: "GET" });
  if (cache) {
    try {
      const matchHeaders = new Headers;
      for (const k of ["Range", "If-None-Match", "If-Modified-Since", "If-Range"]) {
        const v = request.headers.get(k);
        if (v)
          matchHeaders.set(k, v);
      }
      const hit = await cache.match(new Request(cacheKey.url, { method: "GET", headers: matchHeaders }));
      if (hit)
        return withCors(hit, cors, "HIT", method === "HEAD");
    } catch (e) {
      console.error("edge cache match failed", String(e));
    }
  }
  if (method === "HEAD") {
    for (const k of candidateKeys(requested, prefix)) {
      const meta = await env.AUDIO_BUCKET.head(k);
      if (!meta)
        continue;
      resolvedKeys.set(requested, k);
      const h = objectHeaders(meta, k);
      h.set("Content-Length", String(meta.size));
      return withCors(new Response(null, { status: 200, headers: h }), cors, "MISS", true);
    }
    return plain(404, "Not Found", cors);
  }
  for (const k of candidateKeys(requested, prefix)) {
    let obj;
    try {
      obj = await env.AUDIO_BUCKET.get(k, range.kind === "ok" ? { range: range.option } : undefined);
    } catch {
      const meta = await env.AUDIO_BUCKET.head(k);
      if (!meta)
        continue;
      resolvedKeys.set(requested, k);
      return plain(416, "Range Not Satisfiable", cors, { "Content-Range": `bytes */${meta.size}` });
    }
    if (!obj)
      continue;
    resolvedKeys.set(requested, k);
    const h = objectHeaders(obj, k);
    let status = 200;
    let body = obj.body ?? null;
    if (range.kind === "ok") {
      const size = obj.size;
      let start;
      let length;
      if (obj.range && typeof obj.range.offset === "number") {
        start = obj.range.offset;
        length = obj.range.length ?? size - start;
      } else if (obj.range && typeof obj.range.suffix === "number") {
        length = Math.min(obj.range.suffix, size);
        start = size - length;
      } else {
        const o = range.option;
        start = "suffix" in o ? Math.max(0, size - o.suffix) : o.offset;
        length = "suffix" in o ? size - start : o.length ?? size - start;
      }
      length = Math.min(length, size - start);
      if (start >= size || length <= 0) {
        body?.cancel();
        return plain(416, "Range Not Satisfiable", cors, { "Content-Range": `bytes */${size}` });
      }
      status = 206;
      h.set("Content-Range", `bytes ${start}-${start + length - 1}/${size}`);
      h.set("Content-Length", String(length));
      if (cache && ctx)
        ctx.waitUntil(fillCache(cache, cacheKey, env, k));
    } else {
      h.set("Content-Length", String(obj.size));
      if (cache && ctx && body && obj.size <= MAX_EDGE_CACHE_BYTES && !filling.has(cacheKey.url)) {
        const [client, toCache] = body.tee();
        body = client;
        ctx.waitUntil(fillCache(cache, cacheKey, env, k, toCache, obj));
      }
    }
    return withCors(new Response(body, { status, headers: h }), cors, "MISS");
  }
  return plain(404, "Not Found", cors);
}
var src_default = {
  fetch: (request, env, ctx) => handleRequest(request, env, ctx)
};
export {
  parseRange,
  keyFromPath,
  handleRequest,
  src_default as default
};
