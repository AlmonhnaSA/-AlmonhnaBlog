import { AwsClient } from "npm:aws4fetch@1.0.20";
import { imageR2Config, imageObjectUrl } from "../_shared/r2Images.ts";
import type { MediaStorageProvider } from "../_shared/mediaCleanup.ts";
export function r2ImageProvider(env: (name: string) => string | undefined) {
  const config = imageR2Config(env);
  const client = new AwsClient({ ...config, service: "s3", region: "auto" });
  const head = (key: string) => client.fetch(imageObjectUrl(config.base, key), { method: "HEAD" });
  const cleanup: MediaStorageProvider = {
    async removeAndVerify(claim) {
      if (claim.bucket !== "images" || !/^[0-9a-f-]+\/media\/[0-9a-f-]+\.[a-z]+$/i.test(claim.object_key)) throw new Error("unmanaged_image");
      const removed = await client.fetch(imageObjectUrl(config.base, claim.object_key), { method: "DELETE" });
      if (!removed.ok && removed.status !== 404) throw new Error("delete_failed");
      const remaining = await head(claim.object_key);
      if (remaining.status !== 404) throw new Error("absence_unconfirmed");
      const bucket = await client.fetch(config.base, { method: "HEAD" });
      if (!bucket.ok) throw new Error("bucket_unavailable");
    },
  };
  return { cleanup, head, publicUrl: (key: string) => imageObjectUrl(config.publicBase, key),
    async sign(key: string, mime: string) {
      const url = new URL(imageObjectUrl(config.base, key)); url.searchParams.set("X-Amz-Expires", "600");
      const headers = { "Content-Type": mime, "If-None-Match": "*", "Cache-Control": "public, max-age=31536000, immutable" };
      const signed = await client.sign(new Request(url, { method: "PUT", headers }), { aws: { signQuery: true, allHeaders: true } });
      return { uploadUrl: signed.url, headers };
    },
  };
}