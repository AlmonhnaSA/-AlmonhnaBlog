import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/motion/Reveal";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareDialog";
import { readingTimeMinutes } from "@/lib/articleExtras";

const sequence = (value: unknown): string[] =>
  Array.isArray(value)
    ? (value as Array<string | { title?: string }>).map((item) => typeof item === "string" ? item : item?.title || "").filter(Boolean)
    : [];

export const LatestArticles = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["home-latest-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`id, title, excerpt, content, cover_image_url, created_at, approved_at, sequence_points, profiles:author_id (id, name, photo_url), article_categories (categories:category_id (name))`)
        .eq("status", "approved")
        .order("approved_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <section className="latest-editorial"><div className="container mx-auto h-[30rem] animate-pulse bg-muted/30 px-6" /></section>;
  if (!articles?.length) return null;

  return (
    <section className="latest-editorial">
      <div className="container mx-auto px-6">
        <Reveal variant="side" className="section-heading-row">
          <div><p className="editorial-kicker">يُقرأ الآن</p><h2 className="editorial-heading mt-2">أحدث المقالات</h2></div>
          <Link to="/articles" className="editorial-link">كل المقالات </Link>
        </Reveal>

        <div className="latest-card-grid">
          {(articles as any[]).map((article, index) => {
            const points = sequence(article.sequence_points);
            const categories = (article.article_categories || []).map((link: any) => link.categories?.name).filter(Boolean);
            const date = new Date(article.approved_at || article.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
            const articleUrl = `/articles/${article.id}`;
            const publicUrl = `https://www.almonhna.sa${articleUrl}`;

            return (
              <Reveal key={article.id} delay={index * 90} variant={index % 2 ? "side" : "clip"} className="latest-card-reveal">
                <article className={`latest-article-card latest-card-${index + 1}`}>
                  <Link to={articleUrl} className="latest-card-main" aria-label={article.title}>
                    <div className="latest-card-media">
                      <img src={article.cover_image_url} alt={article.title} loading="lazy" />
                      <span className="latest-reading-time"><Clock className="h-3.5 w-3.5" />{readingTimeMinutes(article.content || "")} دقائق</span>
                    </div>
                    <div className="latest-card-copy">
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                      {points.length > 0 && (
                        <div className="latest-sequence" aria-label="تسلسل المقال">
                          {points.slice(0, 3).map((point: string, pointIndex: number) => <span key={`${point}-${pointIndex}`}>{point}</span>)}
                        </div>
                      )}
                    </div>
                  </Link>

                  <footer className="latest-card-footer">
                    <Link to={`/writers/${article.profiles?.id}`} className="latest-card-author">
                      {article.profiles?.photo_url ? <img src={article.profiles.photo_url} alt={article.profiles?.name || "الكاتب"} /> : <span>{article.profiles?.name?.charAt(0)}</span>}
                      <strong>{article.profiles?.name}</strong>
                    </Link>
                    <time dateTime={article.approved_at || article.created_at}>{date}</time>
                                      {categories.length > 0 && <div className="latest-card-categories">{categories.slice(0, 3).map((category: string) => <span key={category}>{category}</span>)}</div>}

                    <div className="latest-card-actions">
                      <ShareButton url={`https://www.almonhna.sa/api/og-share?type=articles&id=${article.id}&v=1`} displayUrl={publicUrl} title={article.title} />
                      <BookmarkButton size="sm" item={{ id: article.id, type: "article", title: article.title, excerpt: article.excerpt, coverImage: article.cover_image_url, authorName: article.profiles?.name || "" }} />
                      <LikeButton contentId={article.id} contentType="article" />
                    </div>
                  </footer>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestArticles;
