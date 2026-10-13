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
    const off = o?.range?.offset ?? 0;
    const len = o?.range?.length ?? data.length - off;
    return { size: data.length, body: data.slice(off, off + len) };
  },
};
const env = { AUDIO_BUCKET: bucket };
const req = (path: string, h: Record<string, string> = {}, method = "GET") =>
  new Request(`https://audio.test${path}`, { method, headers: h });

describe("audio worker", () => {
  test("range returns 206 with exact bytes", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=100-199" }), env);
    expect(r.status).toBe(206);
    expect(r.headers.get("Content-Range")).toBe("bytes 100-199/1000");
    const b = new Uint8Array(await r.arrayBuffer());
    expect(b.length).toBe(100);
    expect(b[0]).toBe(100);
  });
  test("full GET is 200 with mp3 type", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3"), env);
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(r.headers.get("Accept-Ranges")).toBe("bytes");
  });
  test("original audio/ folder layout also resolves", async () => {
    const r = await handleRequest(req("/episodes/audio/7ce8d098/a.mp3"), env);
    expect(r.status).toBe(200);
  });
  test("out-of-range is 416", async () => {
    const r = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Range: "bytes=5000-" }), env);
    expect(r.status).toBe(416);
  });
  test("CORS allows only the site origin", async () => {
    const ok = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Origin: "https://www.almonhna.sa" }), env);
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe("https://www.almonhna.sa");
    const bad = await handleRequest(req("/episodes/7ce8d098/a.mp3", { Origin: "https://evil.example" }), env);
    expect(bad.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
  test("paths outside episodes/ are refused", async () => {
    expect((await handleRequest(req("/secret.txt"), env)).status).toBe(404);
    expect((await handleRequest(req("/episodes/../x"), env)).status).toBe(404);
  });
  test("suffix range", () => {
    expect(parseRange("bytes=-100", 1000)).toEqual({ kind: "ok", start: 900, end: 999 });
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
