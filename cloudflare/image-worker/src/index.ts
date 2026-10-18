interface Env { IMAGE_BUCKET: R2Bucket; ALLOWED_ORIGINS: string }
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") || "";
    const headers = new Headers({ "X-Content-Type-Options": "nosniff" });
    if (env.ALLOWED_ORIGINS.split(",").includes(origin)) { headers.set("Access-Control-Allow-Origin", origin); headers.set("Vary", "Origin"); }
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405, headers });
    let key: string;
    try { key = decodeURIComponent(new URL(request.url).pathname.slice(1)); } catch { return new Response(null, { status: 400 }); }
    if (!key || key.split("/").some(p => !p || p === "." || p === "..") || /[\\\u0000-\u001f]/.test(key) || /(^|\/)(audio|episodes)(\/|$)/i.test(key)) return new Response(null, { status: 404 });
    // Worker has read-only application semantics. No upload/delete endpoints.
    const cache = caches.default;
    const cacheKey = new Request(request.url, { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) {
      const result = new Response(request.method === "HEAD" ? null : cached.body, cached);
      headers.forEach((value, name) => result.headers.set(name, value));
      return result;
    }
    const object = await env.IMAGE_BUCKET.get(key);
    if (!object) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    if (!(object.httpMetadata?.contentType || "").startsWith("image/")) return new Response(null, { status: 404 });
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    const response = new Response(object.body, { headers });
    // Cache without Origin-specific headers to prevent cross-origin leakage.
    const stored = response.clone(); stored.headers.delete("Access-Control-Allow-Origin"); stored.headers.delete("Vary");
    await cache.put(cacheKey, stored);
    return request.method === "HEAD" ? new Response(null, { headers }) : response;
  },
};