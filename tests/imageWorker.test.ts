import { expect, test } from 'bun:test';
import worker from '../cloudflare/image-worker/src/index';
test('image worker never exposes writes or audio objects',async()=>{
  let reads=0;
  const env={ALLOWED_ORIGINS:'https://site.example',IMAGE_BUCKET:{get:async()=>{reads++;return null;}}};
  expect((await worker.fetch(new Request('https://images.example/u.png',{method:'DELETE'}),env as never)).status).toBe(405);
  expect((await worker.fetch(new Request('https://images.example/episodes/file.mp3'),env as never)).status).toBe(404);
  expect(reads).toBe(0);
});
test('image worker restricts cors to approved origin',async()=>{
  const env={ALLOWED_ORIGINS:'https://site.example',IMAGE_BUCKET:{}};
  const allowed=await worker.fetch(new Request('https://images.example/u.png',{method:'OPTIONS',headers:{Origin:'https://site.example'}}),env as never);
  const denied=await worker.fetch(new Request('https://images.example/u.png',{method:'OPTIONS',headers:{Origin:'https://evil.example'}}),env as never);
  expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe('https://site.example');
  expect(denied.headers.has('Access-Control-Allow-Origin')).toBe(false);
});