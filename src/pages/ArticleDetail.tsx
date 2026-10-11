import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Calendar, User, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ShareButton } from "@/components/ShareDialog";
import { ArticleCard } from "@/components/ArticleCard";
import { BookmarkButton } from "@/components/BookmarkButton";
import { LikeButton } from "@/components/LikeButton";
import { TextZoomControl, DEFAULT_ARTICLE_FONT_SIZE, type ReadingBackground } from "@/components/TextZoomControl";
import ArticleContent from "@/components/article/ArticleContent";
import ArticleSequence from "@/components/article/ArticleSequence";
import StoryContinues from "@/components/article/StoryContinues";
import AuthorCard from "@/components/article/AuthorCard";
import { parseSequencePoints, readingTimeMinutes } from "@/lib/articleExtras";

const ArticleDetail = () => {
  const { id } = useParams();
  const [fontSize, setFontSize] = useState(DEFAULT_ARTICLE_FONT_SIZE);
 const [readingBackground, setReadingBackground] =
  useState<ReadingBackground>(() => {
    const saved = window.localStorage.getItem(
      "almonhna-reading-background"
    );

    return saved === "ivory" ||
      saved === "sage" ||
      saved === "mist"
      ? saved as ReadingBackground
      : "paper";
  });
  
  const contentRef = useRef<HTMLDivElement>(null);

  const handleReadingBackground = (next: ReadingBackground) => {
    setReadingBackground(next);
    window.localStorage.setItem("almonhna-reading-background", next);
  };

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          profiles:author_id (
            id,
            name,
            photo_url,
            bio
          ),
          products (
            id,
            name
          )
        `)
        .eq("id", id)
        .eq("status", "approved")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["article-categories", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_categories")
        .select("categories:category_id ( id, name, slug )")
        .eq("article_id", id!);
      if (error) throw error;
      return (data || []).map((r: any) => r.categories).filter(Boolean);
    },
  });

  const { data: knowledgeLinks } = useQuery({
    queryKey: ["article-knowledge-links", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_knowledge_links")
        .select(`
          id, anchor_key, question, target_article_id,
          target:target_article_id ( id, title, status, cover_image_url )
        `)
        .eq("article_id", id!);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: continuations } = useQuery({
    queryKey: ["article-continuations", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_continuations")
        .select(`
          id, display_order,
          target:target_article_id ( id, title, excerpt, cover_image_url, status )
        `)
        .eq("article_id", id!)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || [])
        .map((r: any) => r.target)
        .filter((t: any) => t && t.status === "approved");
    },
  });

  const { data: relatedArticles } = useQuery({
    queryKey: ["related-articles", article?.author_id, id],
    enabled: !!article?.author_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          profiles:author_id (
            id,
            name,
            photo_url
          )
        `)
        .eq("author_id", article!.author_id)
        .eq("status", "approved")
        .neq("id", id!)
        .limit(6);

      if (error) throw error;
      // Shuffle and take 3
      return (data || []).sort(() => Math.random() - 0.5).slice(0, 3);
    },
  });

  // Dynamic OG meta tags for social crawlers
  useEffect(() => {
    if (!article) return;
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(property.startsWith("og:") || property.startsWith("twitter:") ? "property" : "name", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    const articleUrl = `https://www.almonhna.sa/articles/${id}`;
    const FALLBACK = "https://www.almonhna.sa/Monhanalogowithbackground.png";
    let img = FALLBACK;
    try {
      if (article.cover_image_url && /^https?:\/\//i.test(article.cover_image_url)) {
        const u = new URL(article.cover_image_url);
        u.search = "";
        u.pathname = u.pathname
          .replace("/storage/v1/object/sign/", "/storage/v1/object/public/")
          .replace("/storage/v1/render/image/public/", "/storage/v1/object/public/");
        if (u.pathname.startsWith("/storage/v1/object/public/")) {
          u.pathname = u.pathname.replace(
            "/storage/v1/object/public/",
            "/storage/v1/render/image/public/",
          );
          u.search = "?width=1200&height=630&resize=cover&quality=75";
        }
        img = u.toString();
      }
    } catch { /* keep fallback */ }

    document.title = `${article.title} | المُنحنى`;
    setMeta("description", article.excerpt);
    setMeta("og:type", "article");
    setMeta("og:title", `${article.title} | المُنحنى`);
    setMeta("og:description", article.excerpt);
    setMeta("og:image", img);
    setMeta("og:image:width", "1200");
    setMeta("og:image:height", "630");
    setMeta("og:url", articleUrl);
    setMeta("og:site_name", "المُنحنى");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", `${article.title} | المُنحنى`);
    setMeta("twitter:description", article.excerpt);
    setMeta("twitter:image", img);

    return () => {
      document.title = "المُنحنى";
      ["og:type","og:title","og:description","og:image","og:url","twitter:title","twitter:description","twitter:image"].forEach(p => {
        const el = document.querySelector(`meta[property="${p}"]`) || document.querySelector(`meta[name="${p}"]`);
        if (el) el.remove();
      });
    };
  }, [article, id]);

  useEffect(() => {
    if (article) {
      const incrementViews = async () => {
        await supabase
          .from("articles")
          .update({ views: (article.views || 0) + 1 })
          .eq("id", id);
      };
      incrementViews();
    }
  }, [article, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dot-background">
        <TopBar />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background dot-background">
        <TopBar />
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">المقال غير موجود</h1>
        </div>
      </div>
    );
  }

  const sequencePoints = parseSequencePoints((article as any).sequence_points);
  const minutes = readingTimeMinutes(article.content || "");

  return (
    <div className="min-h-screen bg-background dot-background">
      <TopBar />
      <Header />

      <article className="ArticleContainer article-editorial container mx-auto px-4 py-8 max-w-4xl">
        <div className="article-head">
          <div
            className="article-head-media overflow-hidden zoom-media"
            style={{ borderRadius: "20px" }}
          >
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-72 md:h-96 object-cover"
            />
          </div>

          <div className="article-head-text">
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((c: any) => (
              <Link
                key={c.id}
                to={`/articles?category=${encodeURIComponent(c.slug)}`}
                className="text-xs px-3 py-1 rounded-full bg-primary/15 text-brand hover:bg-primary/25 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
        
        
         <h1 className="text-3xl md:text-5xl font-bold leading-[1.35] mb-4">{article.title}</h1>

        {article.excerpt?.trim() && (
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6" style={{ textAlign: "justify" }}>
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center gap-5 text-muted-foreground flex-wrap">
          <Link to={`/writers/${article.profiles.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {article.profiles.photo_url ? (
              <img src={article.profiles.photo_url} alt={article.profiles.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </span>
            )}
            <span className="font-medium text-foreground">{article.profiles.name}</span>
          </Link>
          {article.products && (
            <Link
              to={`/products/${article.products.id}`}
              className="text-accent hover:underline"
            >
              {article.products.name}
            </Link>
          )}

           <div className=" flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
           <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(article.approved_at || article.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
           <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{minutes} دقيقة قراءة</span>
         </div>
      
        </div>
        </div>
      </div>

     <div className="article-editorial-actions flex items-center gap-2">
           <ShareButton
            url={`https://almonhna.sa/api/og-share?type=articles&id=${id}`}
            displayUrl={`https://almonhna.sa/articles/${id}`}
            title={article.title}
            iconSize={20}
          />
          <BookmarkButton
            item={{
              id: article.id,
              type: "article",
              title: article.title,
              excerpt: article.excerpt,
              coverImage: article.cover_image_url,
              authorName: article.profiles?.name || "",
            }}
          />
          <LikeButton
            contentId={article.id}
            contentType="article"
            className="mr-auto"
          />
     </div>

        <ArticleSequence points={sequencePoints} contentRef={contentRef} />

        <div className="prose prose-lg max-w-none">
          <div className="flex justify-end mb-3">
            <TextZoomControl value={fontSize} onChange={setFontSize} background={readingBackground} onBackgroundChange={handleReadingBackground} />
          </div>
          <ArticleContent
            html={article.content}
            links={(knowledgeLinks || []) as any}
            fontSize={fontSize}
            background={readingBackground}
            contentRef={contentRef}
          />
        </div>

      </article>

      <StoryContinues items={(continuations || []) as any} />

      <AuthorCard
        id={article.profiles.id}
        name={article.profiles.name}
        photo={article.profiles.photo_url}
        bio={article.profiles.bio}
      />


      {relatedArticles && relatedArticles.length > 0 && (
        <section className="ArticleContainer container mx-auto px-4 pb-12 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-3">مقالات أخرى للكاتب</h2>
          <div className="grid gap-4">
            {relatedArticles.map((related: any) => (
              <ArticleCard
                key={related.id}
                id={related.id}
                title={related.title}
                excerpt={related.excerpt}
                coverImage={related.cover_image_url}
                author={{
                  name: related.profiles?.name || "",
                  photo: related.profiles?.photo_url || undefined,
                }}
                date={related.created_at}
                type="article"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ArticleDetail;
