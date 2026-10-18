import { expect, test } from "bun:test";
import { validateMediaUpload, MAX_GALLERY_IMAGES, MAX_IMAGE_BYTES, MAX_PDF_BYTES } from "../supabase/functions/_shared/mediaValidation";
test("existing image limit remains 5 MiB", () => {
  expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  expect(() => validateMediaUpload({ size: MAX_IMAGE_BYTES + 1, type: "image/png", purpose: "image" })).toThrow();
});
test("gallery keeps existing 20 images and 20 MiB PDF limits", () => {
  expect(MAX_GALLERY_IMAGES).toBe(20);
  expect(MAX_PDF_BYTES).toBe(20 * 1024 * 1024);
  expect(() => validateMediaUpload({ size: MAX_PDF_BYTES + 1, type: "application/pdf", purpose: "gallery-pdf" })).toThrow();
});
test("transparent and vector images have recognized types", () => {
  expect(validateMediaUpload({ size: 100, type: "image/png", purpose: "image" }).extension).toBe("png");
  expect(validateMediaUpload({ size: 100, type: "image/svg+xml", purpose: "image" }).extension).toBe("svg");
});
test("attachments require explicit server limit and never enter R2", () => {
  expect(() => validateMediaUpload({ size: 100, type: "application/pdf", purpose: "attachment" })).toThrow();
  expect(validateMediaUpload({ size: 100, type: "application/pdf", purpose: "attachment" }, 1000).bucket).toBe("store-files");
});