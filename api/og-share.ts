import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = "https://almonhna.sa";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    let type = (req.query.type as string)?.toLowerCase();
    const id = req.query.id as string;

    if (!type || !id) {
      return res.status(400).json({
        error: "Missing type or id",
        type,
        id,
      });
    }

    if (type === "articles") type = "article";
    if (type !== "article" && type !== "news") type = "article";

    const table = type === "article" ? "articles" : "news";

    // نجلب البيانات من Supabase
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();

    // إذا حدث خطأ نعرضه مباشرة
    if (error) {
      return res.status(500).json({
        message: "Supabase Error",
        error,
      });
    }

    // إذا لم نجد بيانات
    if (!data) {
      return res.status(404).json({
        message: "No data found",
        table,
        id,
      });
    }

    // نعرض البيانات كاملة للتشخيص
    return res.status(200).json({
      success: true,
      table,
      data,
    });

  } catch (err: any) {
    return res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
}


// import type { VercelRequest, VercelResponse } from '@vercel/node';
// import { createClient } from '@supabase/supabase-js';

// const SITE_URL = "https://almonhna.sa";
// const SITE_NAME = "المُنحنى";

// const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://jkaccydmonmsarrsgajk.supabase.co";
// const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWNjeWRtb25tc2FycnNnYWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMjczMzgsImV4cCI6MjA3NzcwMzMzOH0.j8_uxJC7FUipBCCCaTwpjZVWKOyU-tejiPswV6492CE";

// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   let type = (req.query.type as string)?.toLowerCase();
//   const id = req.query.id as string;

//   if (!type || !id) return res.redirect(302, SITE_URL);

//   if (type === "articles") type = "article";
//   if (type !== "article" && type !== "news") type = "article";

//   const table = type === "article" ? "articles" : "news";
//   const pagePath = type === "article" ? `/articles/${id}` : `/news/${id}`;
//   const redirectUrl = `${SITE_URL}${pagePath}`;

//   const userAgent = (req.headers["user-agent"] || "").toLowerCase();
//   const isCrawler = /(whatsapp|facebookexternalhit|twitterbot|x\.com|linkedinbot|telegrambot|slackbot|discordbot|googlebot|bot|crawler|spider)/i.test(userAgent);

//   // if (!isCrawler) {
//   //   return res.redirect(302, redirectUrl);
//   // }

//   const supabase = createClient(supabaseUrl, supabaseKey);

//   const { data, error } = await supabase
//     .from(table)
//     .select("title, excerpt, cover_image_url")
//     .eq("id", id)
//     .single();

//   if (error || !data) return res.redirect(302, redirectUrl);

//   const escape = (s: string) =>
//     s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

//   const html = `<!DOCTYPE html>
// <html lang="ar" dir="rtl">
// <head>
//   <meta charset="utf-8">
//   <title>${escape(data.title)} | ${SITE_NAME}</title>
//   <meta name="description" content="${escape(data.excerpt)}">
//   <meta property="og:type" content="article">
//   <meta property="og:title" content="${escape(data.title)} | ${SITE_NAME}">
//   <meta property="og:description" content="${escape(data.excerpt)}">
//   <meta property="og:image" content="${data.cover_image_url}">
//   <meta property="og:image:width" content="1200">
//   <meta property="og:image:height" content="630">
//   <meta property="og:image:alt" content="${escape(data.title)}">
//   <meta property="og:url" content="${redirectUrl}">
//   <meta property="og:site_name" content="${SITE_NAME}">
//   <meta property="og:locale" content="ar_AR">
//   <meta name="twitter:card" content="summary_large_image">
//   <meta name="twitter:title" content="${escape(data.title)} | ${SITE_NAME}">
//   <meta name="twitter:description" content="${escape(data.excerpt)}">
//   <meta name="twitter:image" content="${data.cover_image_url}">
//   <link rel="icon" href="${SITE_URL}/favicon.ico">
//   <link rel="apple-touch-icon" href="${SITE_URL}/favicon.ico">
//   <meta http-equiv="refresh" content="0;url=${redirectUrl}">
// </head>
// <body>
//   <p>جاري التحويل...</p>
// </body>
// </html>`;

//   res.setHeader("Content-Type", "text/html; charset=utf-8");
//   res.setHeader("Cache-Control", "public, max-age=3600");
//   return res.status(200).send(html);
// }
