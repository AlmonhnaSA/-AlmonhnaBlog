/** Local read-only scanner. SQL session is READ ONLY; HTTP uses GET only. */
import postgres from "postgres";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";
import { buildInventory, csvInventory, type StoredFile } from "./media/inventory";

const expected = process.env.MEDIA_EXPECTED_PROJECT;
const base = process.env.MEDIA_SUPABASE_URL;
const serviceKey = process.env.MEDIA_SERVICE_KEY;
const databaseUrl = process.env.MEDIA_READONLY_DATABASE_URL;
if (!expected || !/^[a-z]{20}$/.test(expected) || base !== `https://${expected}.supabase.co` || !serviceKey || !databaseUrl) throw new Error("Configure local MEDIA_EXPECTED_PROJECT, MEDIA_SUPABASE_URL, MEDIA_SERVICE_KEY and MEDIA_READONLY_DATABASE_URL; values are never printed.");
// This dedicated credential is never inferred from this workspace's Cloud variables.
if (new URL(databaseUrl).hostname !== `db.${expected}.supabase.co` && process.env.MEDIA_CONFIRM_POOLER_PROJECT !== expected) throw new Error("Database project mismatch; a pooler requires explicit local project confirmation.");
const sql = postgres(databaseUrl, { max: 1, onnotice: () => {}, connection: { default_transaction_read_only: "on", statement_timeout: 120000 } });
const errors: string[] = [];
const sources: { location: string; value: unknown }[] = [];
const files: StoredFile[] = [];
const out = resolve(process.env.MEDIA_REPORT_DIR || "/tmp/media-inventory");
async function get(path: string): Promise<unknown> {
  const response = await fetch(`${base}/storage/v1/${path}`, { headers: { apikey: serviceKey || "", Authorization: `Bearer ${serviceKey}` } });
  if (!response.ok) throw new Error(`storage_read_${response.status}`);
  return response.json();
}
async function scanSource(root: string) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", ".env", ".lovable"].includes(entry.name) || entry.name.startsWith(".env")) continue;
    const path = resolve(root, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) await scanSource(path);
    else if ([".ts", ".tsx", ".js", ".css", ".html", ".json", ".svg", ".md"].includes(extname(path))) sources.push({ location: `source:${relative(process.cwd(), path)}`, value: await readFile(path, "utf8") });
  }
}
try {
  await sql.begin("read only isolation level repeatable read", async tx => {
    const role = await tx`select rolsuper, rolbypassrls from pg_roles where rolname = current_user`;
    if (!role[0]?.rolsuper && !role[0]?.rolbypassrls) throw new Error("Full RLS visibility is required for a complete read-only inventory.");
    const buckets = await get("bucket") as { id: string }[];
    const dbBuckets = await tx`select id from storage.buckets order by id`;
    if (JSON.stringify(buckets.map(b => b.id).sort()) !== JSON.stringify(dbBuckets.map(b => b.id).sort())) throw new Error("Storage/database bucket mismatch.");
    // Reading metadata via SQL avoids Storage list's POST and proves complete pagination.
    for (const bucket of dbBuckets) {
      let offset = 0;
      while (true) {
        const rows = await tx`select name, metadata, updated_at from storage.objects where bucket_id = ${bucket.id} order by name limit 500 offset ${offset}`;
        for (const row of rows) files.push({ project: expected, bucket: bucket.id, key: row.name, size: Number(row.metadata?.size || 0), mime: row.metadata?.mimetype || "", modified: String(row.updated_at) });
        if (rows.length < 500) break;
        offset += rows.length;
      }
    }
    const tables = await tx`select tablename from pg_tables where schemaname = 'public' order by tablename`;
    for (const table of tables) {
      try {
        const rows = await tx`select to_jsonb(t) as value from ${tx("public", table.tablename)} t`;
        rows.forEach((row, i) => sources.push({ location: `table:${table.tablename}:row:${i}`, value: row.value }));
      } catch { errors.push(`table_unreadable:${table.tablename}`); }
    }
  });
  for (const dir of ["src", "public", "api", "cloudflare"]) {
    try { await scanSource(resolve(dir)); } catch { errors.push(`source_unreadable:${dir}`); }
  }
  sources.push({ location: "source:index.html", value: await readFile("index.html", "utf8") });
  let protectedKeys: string[] = [];
  if (process.env.MEDIA_PROTECTION_FILE) {
    const protection = JSON.parse(await readFile(process.env.MEDIA_PROTECTION_FILE, "utf8"));
    if (!Array.isArray(protection.keys) || !protection.keys.every((k: unknown) => typeof k === "string")) throw new Error("invalid_protection_file");
    protectedKeys = protection.keys;
  }
  const report = buildInventory({ project: expected, files, sources, errors, protectedKeys, externalReviewed: process.env.MEDIA_EXTERNAL_REVIEWED === "true" });
  await mkdir(out, { recursive: true, mode: 0o700 });
  await writeFile(resolve(out, "inventory.json"), JSON.stringify(report, null, 2), { mode: 0o600 });
  await writeFile(resolve(out, "inventory.csv"), csvInventory(report), { mode: 0o600 });
  console.log(JSON.stringify({ complete: report.complete, ...report.summary, reportDirectory: out }));
} catch { console.error("Inventory failed; no deletion recommendation. Check local connection/project permissions. Secrets and query content are not logged."); process.exitCode = 1; }
finally { await sql.end(); }