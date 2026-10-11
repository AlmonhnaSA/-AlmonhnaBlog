import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceRequestSchema } from "../_shared/serviceRequestValidation.ts";

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  if (Number(req.headers.get("content-length") || 0) > 24000) return respond({ error: "الطلب أكبر من الحجم المسموح" }, 413);
  try {
    const raw = await req.text();
    if (raw.length > 24000) return respond({ error: "الطلب أكبر من الحجم المسموح" }, 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return respond({ error: "بيانات غير صالحة" }, 400); }
    const parsed = serviceRequestSchema.safeParse(body);
    if (!parsed.success) return respond({ error: "تحقق من بيانات الطلب" }, 400);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return respond({ error: "تعذّر حفظ الطلب حاليًا" }, 503);
    const db = createClient(url, key);
    // Infrastructure-supplied address only; hash it instead of storing visitor IPs.
    const address = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address));
    const hash = Array.from(new Uint8Array(digest)).map((v) => v.toString(16).padStart(2, "0")).join("");
    const { data: allowed, error: limitError } = await db.rpc("consume_service_request_limit", { p_key_hash: hash });
    if (limitError) return respond({ error: "تعذّر حفظ الطلب حاليًا" }, 503);
    if (!allowed) return respond({ error: "طلبات كثيرة، حاول بعد قليل" }, 429);

    const values = parsed.data;
    const { data: saved, error } = await db.from("service_requests").insert({
      submission_key: values.submissionKey,
      name: values.name, contact: values.contact, service: values.service, details: values.details,
    }).select("id").single();
    if (error) {
      // A retry may return success only for the exact same, already-persisted request.
      if (error.code === "23505") {
        const { data: previous } = await db.from("service_requests").select("name, contact, service, details")
          .eq("submission_key", values.submissionKey).maybeSingle();
        if (previous && previous.name === values.name && previous.contact === values.contact && previous.service === values.service && previous.details === values.details) {
          return respond({ success: true });
        }
      }
      return respond({ error: "تعذّر حفظ الطلب، حاول مرة أخرى" }, 500);
    }
    if (!saved) return respond({ error: "تعذّر حفظ الطلب" }, 500);

    // Email uses existing project SendGrid configuration, never a client-selected recipient.
    const notify = async () => {
      const apiKey = Deno.env.get("SENDGRID_API_KEY");
      const recipient = Deno.env.get("SERVICE_REQUEST_ADMIN_EMAIL");
      if (!apiKey || !recipient) return;
      try {
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: recipient }], subject: "طلب خدمة جديد — المُنحنى", custom_args: { service_request_id: saved.id } }],
            from: { email: "info@almonhna.sa", name: "المُنحنى" },
            content: [{ type: "text/plain", value: `وصل طلب خدمة جديد إلى المُنحنى.\nالخدمة: ${values.service}\nالاسم: ${values.name}\nالتواصل: ${values.contact}\nتفاصيل الطلب:\n${values.details}\n\nعرض الطلبات: https://munawwar-news-hub.lovable.app/admin/service-requests` }],
          }),
          signal: AbortSignal.timeout(10000),
        });
        await db.from("service_requests").update({ notification_status: response.ok ? "sent" : "failed" }).eq("id", saved.id);
        console.info("Service request notification", { requestId: saved.id, accepted: response.ok, providerStatus: response.status });
      } catch {
        await db.from("service_requests").update({ notification_status: "failed" }).eq("id", saved.id);
        console.error("Service request notification failed", { requestId: saved.id });
      }
    };
    // Save confirmation does not depend on mail delivery; failures remain visible to admins.
    EdgeRuntime.waitUntil(notify());
    return respond({ success: true }, 201);
  } catch {
    return respond({ error: "تعذّر حفظ الطلب، حاول مرة أخرى" }, 500);
  }
});