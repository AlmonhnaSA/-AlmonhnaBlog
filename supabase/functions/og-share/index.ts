import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};

const SITE_URL = "https://www.almonhna.sa";
const SITE_NAME = "المُنحنى";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let type = url.searchParams.get("type")?.toLowerCase();
  const id = url.searchParams.get("id");

  if (!type || !id) return Response.redirect(SITE_URL, 302);

  // تصحيح type لأي جمع أو خطأ
  if (type === "articles") type = "article";
  if (type !== "article" && type !== "news") type = "article"; // افتراضي article

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const table = type === ("article" || "articles") ? "articles" : "news";
  const pagePath =  `/articles/${id}`;  //type === ("article" || "articles") ? `/articles/${id}` : `/news/${id}`;
  const redirectUrl = `${SITE_URL}${pagePath}`;

  const { data, error } = await supabase
    .from(table)
    .select("title, excerpt, cover_image_url")
    .eq("id", id)
    .single();

  // لو ما لقينا المقال، نرجع للصفحة الرئيسية
  if (error || !data) return Response.redirect(redirectUrl, 302);

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>${escapeHtml(data.title)} - ${SITE_NAME}</title>
  <meta name="description" content="${escapeHtml(data.excerpt)}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(data.title)}">
  <meta property="og:description" content="${escapeHtml(data.excerpt)}">
  <meta property="og:image" content="${escapeHtml(data.cover_image_url)}">
  <meta property="og:url" content="${redirectUrl}">
  <meta property="og:site_name" content="${SITE_NAME}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(data.title)}">
  <meta name="twitter:description" content="${escapeHtml(data.excerpt)}">
  <meta name="twitter:image" content="${escapeHtml(data.cover_image_url)}">

  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <script>window.location.href = "${redirectUrl}";</script>
</head>
<body>
  <p>جاري التحويل إلى <a href="${redirectUrl}">${escapeHtml(data.title)}</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
