/** Isolated image provider. Audio credentials/bucket are never reused. */
export function imageR2Config(env: (name: string) => string | undefined) {
  const account = env("R2_IMAGES_ACCOUNT_ID"), accessKeyId = env("R2_IMAGES_ACCESS_KEY_ID"), secretAccessKey = env("R2_IMAGES_SECRET_ACCESS_KEY");
  const bucket = env("R2_IMAGES_BUCKET"), publicBase = env("R2_IMAGES_PUBLIC_URL");
  if (!account || !/^[a-f0-9]{32}$/.test(account) || !accessKeyId || !secretAccessKey || !bucket || !/^[a-z0-9-]+$/.test(bucket) || bucket === "almonhna-audio" || !publicBase) throw new Error("image_r2_not_configured");
  const url = new URL(publicBase);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/" || url.hostname === "audio.almonhna.sa") throw new Error("unsafe_image_origin");
  return { accessKeyId, secretAccessKey, bucket, publicBase: url.origin, base: `https://${account}.r2.cloudflarestorage.com/${bucket}` };
}
export function imageObjectUrl(base: string, key: string) {
  if (!key || key.startsWith("/") || key.split("/").some(p => !p || p === "." || p === "..") || /[\\\u0000-\u001f]/.test(key)) throw new Error("invalid_image_key");
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}