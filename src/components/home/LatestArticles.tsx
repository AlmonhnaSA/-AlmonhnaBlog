import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/motion/Reveal";
import { LatestArticleCard } from "@/components/LatestArticleCard";
import { excludeVisualColumnsFilter, getVisualColumnIds } from "@/lib/visualColumns";

export const LatestArticles = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["home-latest-articles"],
    queryFn: async () => {
      const hidden = excludeVisualColumnsFilter(await getVisualColumnIds());
      const { data, error } = await supabase
        .from("articles")
        .select(`id, title, excerpt, content, cover_image_url, created_at, approved_at, sequence_points, profiles:author_id (id, name, photo_url), article_categories (categories:category_id (name))`)
        .eq("status", "approved")
        .or(hidden ?? "id.not.is.null")
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
            const categories = (article.article_categories || []).map((link: any) => link.categories?.name).filter(Boolean);

            return (
              <Reveal key={article.id} delay={index * 90} variant={index % 2 ? "side" : "clip"} className="latest-card-reveal">
                <LatestArticleCard article={article} categories={categories} className={`latest-card-${index + 1}`} />
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestArticles;
