// Almonhna audio Worker — paste into the Cloudflare dashboard editor (worker.js).
// Requires an R2 bucket binding named AUDIO_BUCKET -> almonhna-audio.
// src/index.ts
var DEFAULT_ORIGINS = "https://www.almonhna.sa,https://almonhna.sa";
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
function parseRange(header, size) {
  if (!header)
    return { kind: "none" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || m[1] === "" && m[2] === "")
    return { kind: "invalid" };
  let start;
  let end;
  if (m[1] === "") {
    const suffix = Number(m[2]);
    if (suffix === 0)
      return { kind: "invalid" };
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end)
    return { kind: "invalid" };
  return { kind: "ok", start, end };
}
function corsHeaders(request, env) {
  const h = new Headers;
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",").map((s) => s.trim()).filter(Boolean);
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
function keyFromPath(pathname, prefix = "episodes/") {
  let key;
  try {
    key = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return null;
  }
  if (!key || key.includes("..") || key.includes("\\") || key.endsWith("/"))
    return null;
  if (!key.startsWith(prefix))
    return null;
  return key;
}
function candidateKeys(key, prefix) {
  const rest = key.slice(prefix.length);
  const list = [key];
  if (!rest.startsWith("audio/"))
    list.push(`${prefix}audio/${rest}`);
  else
    list.push(`${prefix}${rest.slice("audio/".length)}`);
  return list;
}
async function handleRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  if (request.method !== "GET" && request.method !== "HEAD") {
    cors.set("Allow", "GET, HEAD, OPTIONS");
    return new Response("Method Not Allowed", { status: 405, headers: cors });
  }
  const prefix = env.KEY_PREFIX || "episodes/";
  const url = new URL(request.url);
  if (url.pathname === "/health")
    return new Response("ok", { headers: cors });
  const requested = keyFromPath(url.pathname, prefix);
  if (!requested)
    return new Response("Not Found", { status: 404, headers: cors });
  let key = "";
  let meta = null;
  for (const k of candidateKeys(requested, prefix)) {
    meta = await env.AUDIO_BUCKET.head(k);
    if (meta) {
      key = k;
      break;
    }
  }
  if (!meta)
    return new Response("Not Found", { status: 404, headers: cors });
  const size = meta.size;
  const etag = meta.httpEtag || (meta.etag ? `"${meta.etag}"` : undefined);
  const ext = key.split(".").pop()?.toLowerCase() || "";
  const headers = cors;
  headers.set("Content-Type", meta.httpMetadata?.contentType || MIME[ext] || "application/octet-stream");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (etag)
    headers.set("ETag", etag);
  if (meta.uploaded)
    headers.set("Last-Modified", meta.uploaded.toUTCString());
  const inm = request.headers.get("If-None-Match");
  if (etag && inm && inm.split(",").map((s) => s.trim()).includes(etag)) {
    return new Response(null, { status: 304, headers });
  }
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
    if (request.method === "HEAD")
      return new Response(null, { status: 206, headers });
    const obj2 = await env.AUDIO_BUCKET.get(key, { range: { offset: range.start, length } });
    if (!obj2)
      return new Response("Not Found", { status: 404, headers: corsHeaders(request, env) });
    return new Response(obj2.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(size));
  if (request.method === "HEAD")
    return new Response(null, { status: 200, headers });
  const obj = await env.AUDIO_BUCKET.get(key);
  if (!obj)
    return new Response("Not Found", { status: 404, headers: corsHeaders(request, env) });
  return new Response(obj.body, { status: 200, headers });
}
var src_default = {
  fetch: (request, env) => handleRequest(request, env)
};
export {
  parseRange,
  keyFromPath,
  handleRequest,
  src_default as default
};
