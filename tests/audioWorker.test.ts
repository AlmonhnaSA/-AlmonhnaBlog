import { describe, expect, test } from "bun:test";
import { handleRequest, parseRange, type R2BucketLike } from "../cloudflare/audio-worker/src/index";
import { resolveAudioUrl } from "../src/lib/audioUrl";

const data = new Uint8Array(1000).map((_, i) => i % 256);
const KEY = "episodes/7ce8d098/a.mp3";
const bucket: R2BucketLike = {
  async head(k) {
    return k === KEY ? { size: data.length, httpEtag: '"e1"' } : null;
  },
  async get(k, o) {
    if (k !== KEY) return null;
    const r: any = o2(o);
    return { size: data.length, range: r, body: new Response(data.slice(r.offset, r.offset + r.length)).body };
  },
};
function o2(o: any) {
  const r = o?.range;
  if (!r) return { offset: 0, length: data.length };
  if ("suffix" in r) return { offset: data.length - r.suffix, length: r.suffix };
  if (r.offset >= data.length) throw new Error("range");
  return { offset: r.offset, length: Math.min(r.length ?? data.length - r.offset, data.length - r.offset) };
}
const env = { AUDIO_BUCKET: bucket };
const req = (path: string, h: Record<string, string> = {}, method = "GET") =>
  new Request(`https://audio.test${path}`, { method, headers: h });

describe("audio worker", () => {
  test("range returns 206 with exact bytes", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=100-199" }), env, undefined, null);
    expect(r.status).toBe(206);
    expect(r.headers.get("Content-Range")).toBe("bytes 100-199/1000");
    const b = new Uint8Array(await r.arrayBuffer());
    expect(b.length).toBe(100);
    expect(b[0]).toBe(100);
  });
  test("full GET is 200 with mp3 type", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3"), env, undefined, null);
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(r.headers.get("Accept-Ranges")).toBe("bytes");
  });
  test("original audio/ folder layout also resolves", async () => {
    const r = await handleRequest(req("/episodes/audio/7ce8d098/a.mp3"), env, undefined, null);
    expect(r.status).toBe(200);
  });
  test("out-of-range is 416", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=5000-" }), env, undefined, null);
    expect(r.status).toBe(416);
  });
  test("CORS allows only the site origin", async () => {
    const ok = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Origin: "https://www.almonhna.sa" }), env, undefined, null);
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe("https://www.almonhna.sa");
    const bad = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Origin: "https://evil.example" }), env, undefined, null);
    expect(bad.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
  test("paths outside episodes/ are refused", async () => {
    expect((await handleRequest(req("/secret.txt"), env, undefined, null)).status).toBe(404);
    expect((await handleRequest(req("/episodes/../x"), env, undefined, null)).status).toBe(404);
  });
  test("suffix range", () => {
    expect(parseRange("bytes=-100")).toEqual({ kind: "ok", option: { suffix: 100 } });
  });
});

describe("resolveAudioUrl", () => {
  const old = "https://x.supabase.co/storage/v1/object/public/images/audio/u1/f.mp3";
  test("unchanged without a configured service", () => {
    expect(resolveAudioUrl(old, "")).toBe(old);
  });
  test("maps to the R2 service when configured", () => {
    expect(resolveAudioUrl(old, "https://audio.example/")).toBe("https://audio.example/episodes/u1/f.mp3");
  });
  test("already-migrated links are untouched", () => {
    const n = "https://audio.example/episodes/u1/f.mp3";
    expect(resolveAudioUrl(n, "https://audio.example")).toBe(n);
  });
});

describe("audio worker final review", () => {
  test("malformed or multi-range is ignored with a full 200", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=0-1,5-6" }), env, undefined, null);
    expect(r.status).toBe(200);
  });
  test("bytes=-0 is 416", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=-0" }), env, undefined, null);
    expect(r.status).toBe(416);
  });
  test("If-Range with a different ETag returns the full file", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=0-9", "If-Range": '"old"' }), env, undefined, null);
    expect(r.status).toBe(200);
  });
  test("If-Range with the same ETag returns the range", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=0-9", "If-Range": '"e1"' }), env, undefined, null);
    expect(r.status).toBe(206);
  });
  test("HEAD returns size without a body", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", {}, "HEAD"), env, undefined, null);
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Length")).toBe("1000");
    expect((await r.arrayBuffer()).byteLength).toBe(0);
  });
  test("10 concurrent misses in one isolate trigger only one background fill", async () => {
    let fullGets = 0;
    const counting: R2BucketLike = {
      head: bucket.head,
      async get(k, o) { if (!o?.range) fullGets++; return bucket.get(k, o); },
    };
    const store = new Map<string, Response>();
    const cache = {
      async match(r: Request) { return store.get(r.url)?.clone(); },
      async put(r: Request, res: Response) { await res.arrayBuffer(); store.set(r.url, new Response(new Uint8Array(1))); },
    };
    const jobs: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => jobs.push(p) };
    await Promise.all(Array.from({ length: 10 }, (_, i) =>
      handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: `bytes=${i}-${i + 9}` }), { AUDIO_BUCKET: counting }, ctx, cache)));
    await Promise.all(jobs);
    expect(fullGets).toBe(1);
    expect(store.size).toBe(1);
  });
  test("edge copy expires in 7 days while browsers keep a year", async () => {
    const store = new Map<string, Response>();
    const cache = { async match() { return undefined; }, async put(r: Request, res: Response) { store.set(r.url, res); } };
    const jobs: Promise<unknown>[] = [];
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=0-9" }), env, { waitUntil: (p) => jobs.push(p) }, cache);
    await Promise.all(jobs);
    expect(r.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect([...store.values()][0].headers.get("Cache-Control")).toBe("public, max-age=604800");
  });
});

describe("If-Range on an edge cache hit", () => {
  // Fake cache that, like Cloudflare, answers Range from a stored full copy.
  const stored = { etag: '"e1"', lm: "Wed, 01 Jan 2025 00:00:00 GMT" };
  const cache = {
    async match(r: Request) {
      const h = new Headers({ ETag: stored.etag, "Last-Modified": stored.lm, "Content-Type": "audio/mpeg" });
      const range = r.headers.get("Range");
      if (range) {
        h.set("Content-Range", "bytes 0-9/1000");
        return new Response(data.slice(0, 10), { status: 206, headers: h });
      }
      return new Response(data, { status: 200, headers: h });
    },
    async put() {},
  };
  const go = (h: Record<string, string>) =>
    handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=0-9", ...h }), env, undefined, cache);

  test("different ETag returns the full 200 copy, not 206", async () => {
    const r = await go({ "If-Range": '"old"' });
    expect(r.status).toBe(200);
    expect(r.headers.get("X-Audio-Cache")).toBe("HIT");
    expect((await r.arrayBuffer()).byteLength).toBe(1000);
  });
  test("matching ETag returns 206", async () => {
    expect((await go({ "If-Range": '"e1"' })).status).toBe(206);
  });
  test("weak ETag never allows a 206", async () => {
    expect((await go({ "If-Range": 'W/"e1"' })).status).toBe(200);
  });
  test("matching Last-Modified date returns 206, different date returns 200", async () => {
    expect((await go({ "If-Range": stored.lm })).status).toBe(206);
    expect((await go({ "If-Range": "Thu, 02 Jan 2025 00:00:00 GMT" })).status).toBe(200);
  });
  test("query strings do not create separate cache entries", async () => {
    const keys: string[] = [];
    const c = { async match(r: Request) { keys.push(r.url); return undefined; }, async put() {} };
    await handleRequest(req("/episodes/7ce8d098/a.mp3?v=2", { Range: "bytes=0-9" }), env, undefined, c);
    expect(keys[0].includes("?")).toBe(false);
  });
});
