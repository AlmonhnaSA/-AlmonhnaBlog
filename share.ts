import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://www.almonhna.sa";
const SITE_NAME = "المُنحنى";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  const type = (req.query.type as string) || "article";

  if (!id) return res.redirect(302, SITE_URL);

  const table = type === "news" ? "news" : "articles";
  const url = `${SITE_URL}/${type === "news" ? "news" : "articles"}/${id}`;

  const { data } = await supabase
    .from(table)
    .select("title, excerpt, cover_image_url")
    .eq("id", id)
    .single();

  const title = data?.title || SITE_NAME;
  const desc = data?.excerpt || "";
  const image = data?.cover_image_url || `${SITE_URL}/logo.png`;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">

<title>${title}</title>

<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${image}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="article" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${image}" />

<meta http-equiv="refresh" content="2;url=${url}">
</head>

<body>
<p>جاري فتح المقال...</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
