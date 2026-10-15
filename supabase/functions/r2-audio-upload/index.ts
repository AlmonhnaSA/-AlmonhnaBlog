import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";
import {
  MAX_AUDIO_BYTES,
  UPLOAD_PREFIX,
  buildUploadKey,
  isManagedKey,
  keyFromPublicUrl,
  publicUrlFor,
  validateSignInput,
} from "../_shared/audioUploadValidation.ts";

const BUCKET = "almonhna-audio";
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function r2() {
  const accountId = Deno.env.get("R2_ACCOUNT_ID");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
  if (!accountId || !accessKeyId || !secretAccessKey) throw new Error("r2_not_configured");
  return {
    client: new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" }),
    base: `https://${accountId}.r2.cloudflarestorage.com/${BUCKET}`,
  };
}

const objectUrl = (base: string, key: string) => `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;

async function listManaged(client: AwsClient, base: string) {
  const items: { key: string; size: number; modified: number }[] = [];
  let token = "";
  for (let i = 0; i < 20; i++) {
    const u = new URL(base);
    u.searchParams.set("list-type", "2");
    u.searchParams.set("prefix", UPLOAD_PREFIX);
    if (token) u.searchParams.set("continuation-token", token);
    const res = await client.fetch(u.toString());
    if (!res.ok) throw new Error(`list_failed_${res.status}`);
    const xml = await res.text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const k = m[1].match(/<Key>(.*?)<\/Key>/)?.[1] ?? "";
      items.push({
        key: k.replace(/&amp;/g, "&"),
        size: Number(m[1].match(/<Size>(\d+)<\/Size>/)?.[1] ?? 0),
        modified: Date.parse(m[1].match(/<LastModified>(.*?)<\/LastModified>/)?.[1] ?? ""),
      });
    }
    token = xml.match(/<NextContinuationToken>(.*?)<\/NextContinuationToken>/)?.[1] ?? "";
    if (!token) break;
  }
  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await admin.auth.getUser(auth.slice(7));
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const { data: role } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const { client, base } = r2();

    if (action === "sign") {
      const v = validateSignInput(body);
      if (!v.ok) return json({ error: v.error, maxBytes: MAX_AUDIO_BYTES }, 400);
      const key = buildUploadKey(userData.user.id, v.ext);
      const target = new URL(objectUrl(base, key));
      target.searchParams.set("X-Amz-Expires", "600");
      const signed = await client.sign(new Request(target.toString(), { method: "PUT", headers: { "Content-Type": v.contentType } }), {
        aws: { signQuery: true },
      });
      return json({ uploadUrl: signed.url, key, contentType: v.contentType, publicUrl: publicUrlFor(key) });
    }

    if (action === "verify") {
      if (!isManagedKey(body.key)) return json({ error: "invalid_key" }, 400);
      const head = await client.fetch(objectUrl(base, body.key), { method: "HEAD" });
      if (head.status === 404) return json({ error: "not_uploaded" }, 404);
      if (!head.ok) return json({ error: "verify_failed", status: head.status }, 502);
      const size = Number(head.headers.get("content-length") ?? 0);
      const type = (head.headers.get("content-type") ?? "").toLowerCase();
      if (size <= 0 || size > MAX_AUDIO_BYTES || !type.startsWith("audio/")) {
        await client.fetch(objectUrl(base, body.key), { method: "DELETE" });
        return json({ error: "rejected_after_upload" }, 400);
      }
      return json({ ok: true, size, publicUrl: publicUrlFor(body.key) });
    }

    if (action === "discard") {
      if (!isManagedKey(body.key)) return json({ error: "invalid_key" }, 400);
      const { count } = await admin.from("audio_episodes").select("id", { count: "exact", head: true }).eq("audio_url", publicUrlFor(body.key));
      if ((count ?? 0) > 0) return json({ error: "in_use" }, 409);
      const del = await client.fetch(objectUrl(base, body.key), { method: "DELETE" });
      return json({ ok: del.ok || del.status === 404 });
    }

    if (action === "usage" || action === "cleanup") {
      const items = await listManaged(client, base);
      const { data: eps } = await admin.from("audio_episodes").select("audio_url");
      const used = new Set((eps ?? []).map((e) => keyFromPublicUrl(e.audio_url)).filter(Boolean));
      const orphans = items.filter((i) => !used.has(i.key) && Date.now() - i.modified > ORPHAN_AGE_MS);
      let deleted = 0;
      if (action === "cleanup") {
        for (const o of orphans) {
          const r = await client.fetch(objectUrl(base, o.key), { method: "DELETE" });
          if (r.ok || r.status === 404) deleted++;
        }
      }
      return json({
        files: items.length,
        bytes: items.reduce((s, i) => s + i.size, 0),
        orphans: orphans.length,
        orphanBytes: orphans.reduce((s, i) => s + i.size, 0),
        deleted,
      });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("r2-audio-upload failed:", e);
    return json({ error: e instanceof Error ? e.message : "server_error" }, 500);
  }
});
