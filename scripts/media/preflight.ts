/** Independent-schema read-only gate. Never applies SQL or deploys. */
import postgres from "postgres";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const expected = process.env.MEDIA_EXPECTED_PROJECT, connection = process.env.MEDIA_READONLY_DATABASE_URL;
if (!expected || !connection || process.env.MEDIA_SUPABASE_URL !== `https://${expected}.supabase.co`) throw new Error("local_project_binding_required");
if (new URL(connection).hostname !== `db.${expected}.supabase.co`) throw new Error("use_project_bound_direct_connection");
const sql = postgres(connection, { max: 1, onnotice: () => {}, connection: { default_transaction_read_only: "on", statement_timeout: 120000 } });
try {
  const report = await sql.begin("read only isolation level repeatable read", async tx => {
    const columns = await tx`select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position`;
    const policies = await tx`select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','storage') order by tablename,policyname`;
    const grants = await tx`select table_name,grantee,privilege_type from information_schema.role_table_grants where table_schema='public' order by table_name,grantee`;
    const triggers = await tx`select event_object_table,trigger_name,action_statement from information_schema.triggers where trigger_schema='public'`;
    const missing: string[] = [];
    for (const [table, required] of Object.entries({ articles: ['id','author_id','cover_image_url','content','updated_at'], news: ['id','author_id','cover_image_url','gallery_images','content','updated_at'], products: ['id','image_url','updated_at'], store_products: ['id','image_url','updated_at'], profiles: ['id','user_id','photo_url','updated_at'], timelines: ['id','image_url','updated_at'], timeline_stops: ['id','timeline_id','image_url'], audio_episodes: ['id','cover_image_url','updated_at','is_featured'], user_roles: ['user_id','role'] })) {
      for (const column of required) if (!columns.some(c => c.table_name===table && c.column_name===column)) missing.push(`${table}.${column}`);
    }
    return { project: expected, missing, columns, policies, grants, triggers, reviewed: false, note: "Manual RLS, grants, FK/cascade, function and role review required; this report is not activation approval." };
  });
  const directory = resolve(process.env.MEDIA_REPORT_DIR || "media-reports"); await mkdir(directory,{recursive:true});
  await writeFile(resolve(directory,"schema-preflight.json"),JSON.stringify(report,null,2),{mode:0o600});
  console.log(JSON.stringify({ missing: report.missing, readyForManualReview: report.missing.length===0, applied: false }));
  if(report.missing.length) process.exitCode=1;
} catch { console.error("Read-only schema check failed; nothing applied. Check local project credentials and access."); process.exitCode=1; }
finally { await sql.end(); }