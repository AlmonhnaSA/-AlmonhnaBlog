import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://almonhna.sa";
const SITE_NAME = "المُنحنى";
const FALLBACK_IMAGE = `${SITE_URL}/Monhanalogowithbackground.png`;

function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeImage(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return FALLBACK_IMAGE;
  const url = raw.trim();
  if (!url || !/^https?:\/\//i.test(url)) return FALLBACK_IMAGE;
  try {
    const u = new URL(url);
    u.search = "";
    u.pathname = u.pathname.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
    return u.toString();
  } catch {
    return FALLBACK_IMAGE;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let type = url.searchParams.get("type")?.toLowerCase();
  const id = url.searchParams.get("id");

  if (!type || !id) return Response.redirect(SITE_URL, 302);
  if (type === "articles") type = "article";
  if (type !== "article" && type !== "news") type = "article";

  const table = type === "article" ? "articles" : "news";
  const pagePath = type === "article" ? `/articles/${id}` : `/news/${id}`;
  const redirectUrl = `${SITE_URL}${pagePath}`;

  let title = SITE_NAME;
  let description = "منصة المُنحنى";
  let image = FALLBACK_IMAGE;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data } = await supabase
      .from(table)
      .select("title, excerpt, cover_image_url")
      .eq("id", id)
      .single();
    if (data) {
      title = data.title || title;
      description = data.excerpt || description;
      image = normalizeImage(data.cover_image_url);
    }
  } catch {
    // keep fallbacks
  }

  const t = escapeHtml(title);
  const d = escapeHtml(description);

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${t} | ${SITE_NAME}</title>
  <meta name="description" content="${d}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="ar_AR">
  <meta property="og:title" content="${t} | ${SITE_NAME}">
  <meta property="og:description" content="${d}">
  <meta property="og:url" content="${redirectUrl}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${t} | ${SITE_NAME}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${t} | ${SITE_NAME}">
  <meta name="twitter:description" content="${d}">
  <meta name="twitter:image" content="${image}">

  <link rel="canonical" href="${redirectUrl}">
  <link rel="icon" href="${SITE_URL}/logoIcon.png">
  <link rel="apple-touch-icon" href="${SITE_URL}/logoIcon.png">
</head>
<body>
  <p>جاري التحويل إلى <a href="${redirectUrl}">${t}</a></p>
  <script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "access-control-allow-origin": "*",
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
});
