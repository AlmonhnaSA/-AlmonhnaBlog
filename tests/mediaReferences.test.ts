import { describe, expect, test } from "bun:test";
import { collectReferences, parseMediaUrl, isAudio, embeddedBytes, cleanupBlockers } from "../supabase/functions/_shared/mediaReferences";
const project = "abcdefghijklmnopqrst";
const url = `https://${project}.supabase.co/storage/v1/object/public/images/user/test.png`;
describe("media identity", () => {
  test("original and transformed URLs identify the same stored image", () => {
    expect(parseMediaUrl(url, project)).toEqual(parseMediaUrl(url.replace("object/public", "render/image/public") + "?width=320&quality=72", project));
  });
  test("signed query tokens do not enter identity", () => {
    expect(parseMediaUrl(url.replace("object/public", "object/sign") + "?token=private", project)?.key).toBe("user/test.png");
  });
  test("nested private content and encoded URLs are references", () => {
    expect(collectReferences({ status: "rejected", content: `<img src="${encodeURIComponent(url)}">`, gallery: [url] }, project)).toHaveLength(2);
  });
  test("JSON Unicode escaped slash remains protected", () => {
    expect(collectReferences(url.replaceAll("/", "\\u002f"), project)[0]?.identity.key).toBe("user/test.png");
  });
  test("other project and traversal are not deletion identities", () => {
    expect(parseMediaUrl(url.replace(project, "otherproject"), project)).toBeNull();
    expect(parseMediaUrl(url.replace("user/test", "user/%2e%2e/test"), project)).toBeNull();
    expect(parseMediaUrl("data:image/png;base64,AAAA", project)).toBeNull();
  });
  test("base64 contributes bytes, not a storage object", () => {
    expect(embeddedBytes({ content: "data:image/png;base64,YWJjZA==" })).toBe(4);
    expect(collectReferences("data:image/png;base64,YWJjZA==", project)).toHaveLength(0);
  });
  test("audio is excluded regardless of old folder or extension", () => {
    expect(isAudio("audio/user/a.bin")).toBe(true);
    expect(isAudio("x/file.mp3")).toBe(true);
    expect(isAudio("x/file.bin", "audio/mpeg")).toBe(true);
  });
});
describe("cleanup fails closed", () => {
  const valid = { managed: true, audio: false, references: 0, activeLease: false, completeScan: true, externalReviewed: true, state: "ready", saved: true };
  test("shared files are retained", () => expect(cleanupBlockers({ ...valid, references: 2 })).toContain("referenced"));
  test("failed save retains original", () => expect(cleanupBlockers({ ...valid, saved: false })).toContain("save_not_confirmed"));
  test("unknown scan never permits cleanup", () => expect(cleanupBlockers({ ...valid, completeScan: false })).toContain("incomplete_scan"));
  test("active drafts are retained", () => expect(cleanupBlockers({ ...valid, activeLease: true })).toContain("active_draft"));
  test("legacy files require review", () => expect(cleanupBlockers({ ...valid, managed: false })).toContain("legacy_or_unregistered"));
  test("audio cleanup forbidden", () => expect(cleanupBlockers({ ...valid, audio: true })).toContain("audio_excluded"));
  test("external use cannot be assumed absent", () => expect(cleanupBlockers({ ...valid, externalReviewed: false })).toContain("external_use_unreviewed"));
  test("deleting files cannot be reattached as ready", () => expect(cleanupBlockers({ ...valid, state: "deleting" })).toContain("not_ready"));
});