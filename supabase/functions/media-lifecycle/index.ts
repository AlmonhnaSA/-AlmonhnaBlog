import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { validateMediaUpload, UUID } from "../_shared/mediaValidation.ts";

// STAGED: no deploy under the current approval. Deletion cannot be enabled
// with a frontend flag, request, or secret. Requires separate reviewed release.
const PHYSICAL_DELETE_ENABLED = false;
const tables = new Set(["articles", "news", "products", "store_products", "profiles", "timelines", "audio_episodes"]);
const respond = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "method_not_allowed" }, 405);
  try {
    const base = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!base || !serviceKey || !anon) return respond({ error: "not_configured" }, 503);
    const authorization = req.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) return respond({ error: "unauthorized" }, 401);
    const admin = createClient(base, serviceKey, { auth: { persistSession: false } });
    const { data: auth, error: authError } = await admin.auth.getUser(authorization.slice(7));
    if (authError || !auth.user) return respond({ error: "unauthorized" }, 401);
    const user = auth.user;
    const caller = createClient(base, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: role, error: roleError } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (roleError) return respond({ error: "authorization_unavailable" }, 503);
    const body = await req.json();
    const audit = async (operation: string, outcome: string, id?: string) => {
      const { error } = await admin.from("media_audit").insert({ actor_id: user.id, operation, outcome, asset_id: id });
      if (error) throw new Error("audit_unavailable");
    };
    if (body.action === "capabilities") {
      const { error } = await admin.from("media_assets").select("id").limit(1);
      return error ? respond({ error: "schema_not_ready" }, 503) : respond({ version: 1, mutations: Deno.env.get("MEDIA_MUTATIONS_VALIDATED") === "true", physicalDelete: PHYSICAL_DELETE_ENABLED, dryRun: true });
    }
    if (body.action === "sign") {
      const validated = validateMediaUpload(body, Number(Deno.env.get("MEDIA_ATTACHMENT_MAX_BYTES")) || undefined);
      if (validated.bucket === "store-files" && !role) return respond({ error: "forbidden" }, 403);
      const id = crypto.randomUUID();
      const path = `${user.id}/media/${id}.${validated.extension}`;
      const { error } = await admin.from("media_assets").insert({ id, owner_id: user.id, bucket: validated.bucket, object_key: path, bytes: body.size, mime: body.type });
      if (error) return respond({ error: "registry_unavailable" }, 503);
      await audit("upload_reserved", "registered", id);
      const { data: signed, error: signError } = await admin.storage.from(validated.bucket).createSignedUploadUrl(path, { upsert: false });
      if (signError || !signed) return respond({ error: "sign_failed" }, 502);
      return respond({ id, bucket: validated.bucket, path, token: signed.token });
    }
    if (body.action === "verify") {
      if (!UUID.test(body.id || "")) return respond({ error: "invalid_id" }, 400);
      const { data: asset, error } = await admin.from("media_assets").select("*").eq("id", body.id).eq("owner_id", user.id).single();
      if (error || !asset || asset.state !== "uploading") return respond({ error: "unknown_upload" }, 409);
      const { data: info, error: infoError } = await admin.storage.from(asset.bucket).info(asset.object_key);
      if (infoError || Number(info?.size) !== Number(asset.bytes) || info?.contentType !== asset.mime) return respond({ error: "verification_failed" }, 409);
      const { error: updateError } = await admin.from("media_assets").update({ state: "ready" }).eq("id", asset.id).eq("state", "uploading");
      if (updateError) return respond({ error: "verification_failed" }, 409);
      await audit("upload_verified", "ready", asset.id);
      return respond({ url: admin.storage.from(asset.bucket).getPublicUrl(asset.object_key).data.publicUrl });
    }
    if (body.action === "save" || body.action === "delete") {
      if (!tables.has(body.table) || (body.id && !UUID.test(body.id))) return respond({ error: "invalid_record" }, 400);
      // An invoker RPC—not the service key—performs mutations under existing RLS.
      const name = body.action === "save" ? "media_save" : "media_delete";
      const args = body.action === "save" ? { p_table: body.table, p_id: body.id || null, p_values: body.values, p_children: body.children || {}, p_expected_updated_at: body.expectedUpdatedAt || null } : { p_table: body.table, p_id: body.id, p_expected_updated_at: body.expectedUpdatedAt };
      await audit(`${body.action}:${body.table}`, "requested");
      const { data, error } = await caller.rpc(name, args);
      if (error || !data) { await audit(`${body.action}:${body.table}`, "rejected"); return respond({ error: "save_delete_conflict_or_forbidden" }, 409); }
      await audit(`${body.action}:${body.table}`, "committed");
      if (body.action === "delete") return respond(data);
      const { data: readback, error: readError } = await caller.from(body.table).select("*").eq("id", data.id).single();
      if (readError || !readback) return respond({ error: "readback_failed_old_files_retained" }, 409);
      return respond({ row: readback, cleanup: "preview_only" });
    }
    if (body.action === "cleanup" || body.action === "preview") {
      if (!role) return respond({ error: "forbidden" }, 403);
      await audit("cleanup", "blocked_preview_only");
      return respond({ dryRun: true, physicalDelete: false, blocked: ["independent_inventory_and_backfill_required", "encoded_reference_fencing_review_required", "external_protection_review_required", "separate_deletion_approval_required"], deleted: 0 });
    }
    return respond({ error: "invalid_action" }, 400);
  } catch { return respond({ error: "validation_or_service_failure" }, 400); }
});