import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = "https://almonhna.sa";
const SITE_NAME = "المُنحنى";
const FALLBACK_IMAGE = `${SITE_URL}/Monhanalogowithbackground.png`;

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://jkaccydmonmsarrsgajk.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWNjeWRtb25tc2FycnNnYWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMjczMzgsImV4cCI6MjA3NzcwMzMzOH0.j8_uxJC7FUipBCCCaTwpjZVWKOyU-tejiPswV6492CE";

const escape = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Make sure the image URL is a direct, public, non-signed URL.
// - strips query strings (removes signed-URL tokens)
// - converts signed paths to public paths
// - falls back to default OG image if unusable
function normalizeImage(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return FALLBACK_IMAGE;
  let url = raw.trim();
  if (!url) return FALLBACK_IMAGE;
  if (!/^https?:\/\//i.test(url)) return FALLBACK_IMAGE;
  try {
    const u = new URL(url);
    // drop any token/query params (signed URLs)
    u.search = "";
    // convert "/storage/v1/object/sign/..." to "/storage/v1/object/public/..."
    u.pathname = u.pathname.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
    return u.toString();
  } catch {
    return FALLBACK_IMAGE;
  }
}

function buildHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
}) {
  const title = escape(opts.title);
  const description = escape(opts.description);
  const image = opts.image;
  const url = opts.url;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${title} | ${SITE_NAME}</title>
  <meta name="description" content="${description}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="ar_AR">
  <meta property="og:title" content="${title} | ${SITE_NAME}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title} | ${SITE_NAME}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} | ${SITE_NAME}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">

  <link rel="canonical" href="${url}">
  <link rel="icon" href="${SITE_URL}/logoIcon.png">
  <link rel="apple-touch-icon" href="${SITE_URL}/logoIcon.png">
</head>
<body>
  <p>جاري التحويل إلى <a href="${url}">${title}</a></p>
  <script>window.location.replace(${JSON.stringify(url)});</script>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let type = (req.query.type as string)?.toLowerCase();
  const id = req.query.id as string;

  if (!type || !id) return res.redirect(302, SITE_URL);

  if (type === "articles") type = "article";
  if (type !== "article" && type !== "news") type = "article";

  const table = type === "article" ? "articles" : "news";
  const pagePath = type === "article" ? `/articles/${id}` : `/news/${id}`;
  const redirectUrl = `${SITE_URL}${pagePath}`;

  // Always respond with HTML containing OG tags. Browsers will follow the JS redirect;
  // crawlers will read the meta tags. This guarantees no broken previews.
  let title = SITE_NAME;
  let description = "منصة المُنحنى";
  let image = FALLBACK_IMAGE;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
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

  const html = buildHtml({ title, description, image, url: redirectUrl });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Cache HTML briefly so crawlers re-fetch reasonably; allow CDN revalidation.
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
