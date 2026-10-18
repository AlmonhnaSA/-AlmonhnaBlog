/** Local-only, no SQL writes, no source deletes, no overwrite. */
import { AwsClient } from "aws4fetch";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { imageR2Config, imageObjectUrl } from "../../supabase/functions/_shared/r2Images";
import { isAudio } from "../../supabase/functions/_shared/mediaReferences";
export const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
export const migrationKey = (bucket: string, key: string) => {
  if (!["images", "store-files"].includes(bucket) || isAudio(key)) throw new Error("unsupported_source");
  imageObjectUrl("https://example.invalid", key);
  return `legacy/${bucket}/${key}`;
};
if (import.meta.main) {
  try {
    const mode = process.argv[2], file = process.argv[3];
    if (!["copy", "verify", "dry-run"].includes(mode) || !file) throw new Error("usage");
    const report = JSON.parse(await readFile(file, "utf8"));
    const project = process.env.MEDIA_EXPECTED_PROJECT;
    if (!report.complete || !project || report.project !== project || process.env.MEDIA_SUPABASE_URL !== `https://${project}.supabase.co`) throw new Error("inventory_binding");
    const files = report.files.filter((f: {mime: string; key: string; bucket: string}) => f.mime.startsWith("image/") && !isAudio(f.key, f.mime) && ["images", "store-files"].includes(f.bucket));
    if (mode === "dry-run") { console.log(JSON.stringify({ files: files.length, bytes: files.reduce((n: number, f: {size: number}) => n + f.size, 0), deletes: 0 })); process.exit(0); }
    if (mode === "copy" && process.env.MEDIA_COPY_APPROVED !== "true") throw new Error("copy_approval_required");
    const config = imageR2Config(name => process.env[name]);
    const client = new AwsClient({ ...config, service: "s3", region: "auto" });
    const directory = resolve(process.env.MEDIA_REPORT_DIR || "media-reports");
    await mkdir(directory, { recursive: true });
    const manifestPath = resolve(directory, "migration-verified.json");
    let manifest: Record<string, { hash: string; bytes: number }> = {};
    try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); } catch { /* new run */ }
    let verified = 0;
    for (const f of files) {
      const key = migrationKey(f.bucket, f.key);
      const sourceUrl = `${process.env.MEDIA_SUPABASE_URL}/storage/v1/object/authenticated/${f.bucket}/${f.key.split("/").map(encodeURIComponent).join("/")}`;
      const source = await fetch(sourceUrl, { headers: { apikey: process.env.MEDIA_SERVICE_KEY || "", Authorization: `Bearer ${process.env.MEDIA_SERVICE_KEY || ""}` } });
      if (!source.ok) throw new Error("source_unavailable");
      const bytes = new Uint8Array(await source.arrayBuffer());
      if (bytes.length !== f.size) throw new Error("source_size_changed_refresh_inventory");
      const hash = digest(bytes), target = imageObjectUrl(config.base, key);
      const existing = await client.fetch(target, { method: "HEAD" });
      if (existing.status === 404 && mode === "copy") {
        const put = await client.fetch(target, { method: "PUT", headers: { "Content-Type": f.mime, "If-None-Match": "*", "x-amz-meta-sha256": hash, "Cache-Control": "public, max-age=31536000, immutable" }, body: bytes });
        if (!put.ok && put.status !== 412) throw new Error("copy_failed");
      } else if (!existing.ok) throw new Error("target_missing_or_unavailable");
      // Full destination read verifies bytes, not multipart ETags or metadata alone.
      const downloaded = await client.fetch(target);
      if (!downloaded.ok) throw new Error("destination_unavailable");
      const copied = new Uint8Array(await downloaded.arrayBuffer());
      if (copied.length !== bytes.length || digest(copied) !== hash) throw new Error("checksum_mismatch_never_overwrite");
      manifest[`${config.bucket}/${key}`] = { hash, bytes: bytes.length };
      const temp = `${manifestPath}.tmp`;
      await writeFile(temp, JSON.stringify(manifest, null, 2), { mode: 0o600 });
      await import("node:fs/promises").then(fs => fs.rename(temp, manifestPath));
      verified++;
    }
    console.log(JSON.stringify({ verified, total: files.length, deletes: 0 }));
  } catch { console.error("Migration stopped safely. Check local configuration, refreshed inventory, approval and file checksums. No source files deleted; no secrets logged."); process.exitCode = 1; }
}