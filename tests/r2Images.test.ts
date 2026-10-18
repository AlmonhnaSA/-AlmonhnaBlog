import { expect, test } from "bun:test";
import { imageR2Config, imageObjectUrl } from "../supabase/functions/_shared/r2Images";
import { resolveImageUrl } from "../src/lib/imageUrl";
import { digest, migrationKey } from "../scripts/media/migrate-images";
const settings: Record<string,string> = { R2_IMAGES_ACCOUNT_ID:'a'.repeat(32),R2_IMAGES_ACCESS_KEY_ID:'test',R2_IMAGES_SECRET_ACCESS_KEY:'test',R2_IMAGES_BUCKET:'almonhna-images',R2_IMAGES_PUBLIC_URL:'https://images.example.com' };
test('images never reuse audio bucket or domain',()=>{
  expect(()=>imageR2Config(n=>({...settings,R2_IMAGES_BUCKET:'almonhna-audio'})[n])).toThrow();
  expect(()=>imageR2Config(n=>({...settings,R2_IMAGES_PUBLIC_URL:'https://audio.almonhna.sa'})[n])).toThrow();
  expect(imageR2Config(n=>settings[n]).bucket).toBe('almonhna-images');
});
test('original and transformed public links resolve to same preserved bytes',()=>{
  const original='https://example.supabase.co/storage/v1/object/public/images/u/p.png';
  const transformed=original.replace('object/public','render/image/public')+'?width=96';
  expect(resolveImageUrl(original,'https://images.example.com','example')).toBe('https://images.example.com/legacy/images/u/p.png');
  expect(resolveImageUrl(transformed,'https://images.example.com','example')).toBe(resolveImageUrl(original,'https://images.example.com','example'));
  expect(resolveImageUrl(original)).toBe(original);
});
test('signed/private links and foreign projects never relocate',()=>{
  const url='https://other.supabase.co/storage/v1/object/public/images/u.png';
  expect(resolveImageUrl(url,'https://images.example.com','example')).toBe(url);
  const signed='https://example.supabase.co/storage/v1/object/sign/images/u.png?token=x';
  expect(resolveImageUrl(signed,'https://images.example.com','example')).toBe(signed);
});
test('migration preserves image paths and excludes audio',()=>{
  expect(migrationKey('images','user/original.png')).toBe('legacy/images/user/original.png');
  expect(()=>migrationKey('images','episodes/a.mp3')).toThrow();
  expect(()=>imageObjectUrl('https://example.com','../a')).toThrow();
});
test('checksum detects byte changes even at identical length',()=>{
  expect(digest(new Uint8Array([1,2]))).not.toBe(digest(new Uint8Array([2,1])));
});