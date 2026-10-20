export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_GALLERY_IMAGES = 20;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const imageTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/gif", "gif"], ["image/svg+xml", "svg"], ["image/avif", "avif"]]);
export function validateMediaUpload(input: { size: number; type: string; purpose: string }, storeLimit?: number) {
  if (!Number.isSafeInteger(input.size) || input.size <= 0) throw new Error("invalid_size");
  if (input.purpose === "image") {
    if (!imageTypes.has(input.type)) throw new Error("unsupported_image");
    if (input.size > MAX_IMAGE_BYTES) throw new Error("image_too_large");
    return { bucket: "images", extension: imageTypes.get(input.type) || "img" };
  }
  if (input.purpose === "gallery-pdf") {
    if (input.type !== "application/pdf" || input.size > MAX_PDF_BYTES) throw new Error("invalid_pdf");
    return { bucket: "images", extension: "pdf" };
  }
  if (input.purpose === "attachment") {
    // A server-side explicit limit is required; no arbitrary new business limit.
    if (!storeLimit || input.size > storeLimit || /^audio\//i.test(input.type)) throw new Error("attachment_policy_required");
    return { bucket: "store-files", extension: "bin" };
  }
  throw new Error("invalid_purpose");
}