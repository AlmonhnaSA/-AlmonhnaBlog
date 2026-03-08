import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = "https://almonhna.sa";
const SITE_NAME = "المُنحنى";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://jkaccydmonmsarrsgajk.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWNjeWRtb25tc2FycnNnYWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMjczMzgsImV4cCI6MjA3NzcwMzMzOH0.j8_uxJC7FUipBCCCaTwpjZVWKOyU-tejiPswV6492CE";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let type = (req.query.type as string)?.toLowerCase();
  const id = req.query.id as string;

  if (!type || !id) return res.redirect(302, SITE_URL);

  if (type === "articles") type = "article";
  if (type !== "article" && type !== "news") type = "article";

  const table = type === "article" ? "articles" : "news";
  const pagePath = type === "article" ? `/articles/${id}` : `/news/${id}`;
  const redirectUrl = `${SITE_URL}${pagePath}`;

  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  const isCrawler = /(whatsapp|facebookexternalhit|twitterbot|x\.com|linkedinbot|telegrambot|slackbot|discordbot|googlebot|bot|crawler|spider)/i.test(userAgent);

  if (!isCrawler) {
    return res.redirect(302, redirectUrl);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from(table)
    .select("title, excerpt, cover_image_url")
    .eq("id", id)
    .single();

  if (error || !data) return res.redirect(302, redirectUrl);

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${escape(data.title)} - ${SITE_NAME}</title>
  <meta name="description" content="${escape(data.excerpt)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escape(data.title)}">
  <meta property="og:description" content="${escape(data.excerpt)}">
  <meta property="og:image" content="${data.cover_image_url}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${redirectUrl}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(data.title)}">
  <meta name="twitter:description" content="${escape(data.excerpt)}">
  <meta name="twitter:image" content="${data.cover_image_url}">
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
</head>
<body>
  <p>جاري التحويل...</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.status(200).send(html);
}
