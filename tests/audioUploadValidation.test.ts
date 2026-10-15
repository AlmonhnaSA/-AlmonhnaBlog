import { describe, expect, it } from "vitest";
import {
  MAX_AUDIO_BYTES,
  buildUploadKey,
  isManagedKey,
  keyFromPublicUrl,
  publicUrlFor,
  validateSignInput,
} from "../supabase/functions/_shared/audioUploadValidation";

describe("R2 audio upload rules", () => {
  it("accepts mp3 up to 50MB", () => {
    expect(validateSignInput({ contentType: "audio/mpeg", size: 50 * 1024 * 1024 })).toMatchObject({ ok: true, ext: "mp3" });
  });
  it("rejects files over 50MB", () => {
    expect(validateSignInput({ contentType: "audio/mpeg", size: MAX_AUDIO_BYTES + 1 })).toEqual({ ok: false, error: "too_large" });
  });
  it("rejects non-audio types", () => {
    expect(validateSignInput({ contentType: "image/png", size: 100 })).toEqual({ ok: false, error: "unsupported_type" });
  });
  it("rejects empty size", () => {
    expect(validateSignInput({ contentType: "audio/mpeg", size: 0 })).toEqual({ ok: false, error: "invalid_size" });
  });
  it("builds keys under the uploads prefix", () => {
    expect(buildUploadKey("abc-123", "mp3", 1000, "r4nd")).toBe("episodes/uploads/abc-123/1000-r4nd.mp3");
  });
  it("never manages old or traversal keys", () => {
    expect(isManagedKey("episodes/7ce8/old.mp3")).toBe(false);
    expect(isManagedKey("episodes/uploads/../x.mp3")).toBe(false);
    expect(isManagedKey("episodes/uploads/u/1-a.mp3")).toBe(true);
  });
  it("uses the audio.almonhna.sa domain", () => {
    expect(publicUrlFor("episodes/uploads/u/1-a.mp3")).toBe("https://audio.almonhna.sa/episodes/uploads/u/1-a.mp3");
    expect(keyFromPublicUrl("https://audio.almonhna.sa/episodes/uploads/u/1-a.mp3")).toBe("episodes/uploads/u/1-a.mp3");
    expect(keyFromPublicUrl("https://x.supabase.co/storage/v1/object/public/images/audio/a.mp3")).toBeNull();
  });
});
