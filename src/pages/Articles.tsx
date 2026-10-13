import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { LatestArticleCard } from "@/components/LatestArticleCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { excludeVisualColumnsFilter, getVisualColumnIds } from "@/lib/visualColumns";
import { Button } from "@/components/ui/button";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
  created_at: string;
  approved_at?: string | null;
  sequence_points?: unknown;
  profiles: {
    id: string;
    name: string;
    photo_url: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ARTICLES_PER_PAGE = 20;

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articleCategories, setArticleCategories] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSlug = searchParams.get("category") || "";
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const hidden = excludeVisualColumnsFilter(await getVisualColumnIds());

      const [
        { data: initialArticles, error },
        { data: cats },
        { data: links },
      ] = await Promise.all([
        supabase
          .from("articles")
          .select(`
            *,
            profiles (
              id,
              name,
              photo_url
            )
          `)
          .eq("status", "approved")
          .or(hidden ?? "id.not.is.null")
          .order("approved_at", { ascending: false })
          .range(0, ARTICLES_PER_PAGE - 1),

        supabase
          .from("categories")
          .select("id, name, slug, display_order")
          .order("display_order"),

        supabase
          .from("article_categories")
          .select("article_id, categories:category_id ( id, name, slug )"),
      ]);

      if (error) throw error;

      setArticles(initialArticles || []);
      setCategories(cats || []);

      const map: Record<string, string[]> = {};

      (links || []).forEach((row: any) => {
        if (!row.categories) return;

        map[row.article_id] = [
          ...(map[row.article_id] || []),
          row.categories.slug,
        ];
      });

      setArticleCategories(map);

      // إذا رجعت أقل من 20، فهذا يعني ما فيه مقالات إضافية
      setHasMore((initialArticles?.length || 0) === ARTICLES_PER_PAGE);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل المقالات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreArticles = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);

      const from = articles.length;
      const to = from + ARTICLES_PER_PAGE - 1;
      const hidden = excludeVisualColumnsFilter(await getVisualColumnIds());

      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          profiles (
            id,
            name,
            photo_url
          )
        `)
        .eq("status", "approved")
        .or(hidden ?? "id.not.is.null")
        .order("approved_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newArticles = data || [];

      setArticles((prev) => [...prev, ...newArticles]);

      // تحميل تصنيفات المقالات الجديدة
      if (newArticles.length > 0) {
        const newArticleIds = newArticles.map((article) => article.id);

        const { data: links, error: linksError } = await supabase
          .from("article_categories")
          .select(
            "article_id, categories:category_id ( id, name, slug )"
          )
          .in("article_id", newArticleIds);

        if (linksError) throw linksError;

        setArticleCategories((prev) => {
          const updated = { ...prev };

          (links || []).forEach((row: any) => {
            if (!row.categories) return;

            updated[row.article_id] = [
              ...(updated[row.article_id] || []),
              row.categories.slug,
            ];
          });

          return updated;
        });
      }

      // إذا رجعت أقل من 20، وصلنا لنهاية المقالات
      setHasMore(newArticles.length === ARTICLES_PER_PAGE);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل المزيد من المقالات",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const slugToName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.slug, c.name])),
    [categories]
  );

  const visible = useMemo(() => {
    if (!activeSlug) return articles;

    return articles.filter((article) =>
      (articleCategories[article.id] || []).includes(activeSlug)
    );
  }, [articles, articleCategories, activeSlug]);

  const selectCategory = (slug: string) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-background articles-archive-page">
      <TopBar />
      <Header />

      <main className="container mx-auto px-8 py-12">
        <div className="archive-page-heading">
          <h1 className="site-section-heading">
            جميع المقالات
          </h1>

          <p className="text-muted-foreground">
كل ما نشر على المُنحنى , مرتباً من الأحدث           </p>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="archive-category-tabs" aria-label="تصنيفات المقالات">
            <Button
              variant="ghost"
              type="button"
              aria-pressed={!activeSlug}
              onClick={() => selectCategory("")}
              className={cn(
                "archive-category-tab",
                !activeSlug
                  ? "is-active"
                  : ""
              )}
            >
              الكل
            </Button>

            {categories.map((cat) => (
              <Button
                variant="ghost"
                key={cat.id}
                type="button"
                aria-pressed={activeSlug === cat.slug}
                onClick={() => selectCategory(cat.slug)}
                className={cn(
                  "archive-category-tab",
                  activeSlug === cat.slug
                    ? "is-active"
                    : ""
                )}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {/* Loading initial articles */}
        {loading ? (
          <div className="archive-article-grid">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="archive-card-skeleton bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {activeSlug
                ? `لا توجد مقالات في "${
                    slugToName[activeSlug] || activeSlug
                  }" حالياً`
                : "لا توجد مقالات منشورة حالياً"}
            </p>
          </div>
        ) : (
          <>
            {/* Articles */}
            <div className="archive-article-grid">
              {visible.map((article) => (
                <ArticleCard
                  key={article.id}
                   variant="archive"
                  id={article.id}
                  title={article.title}
                  excerpt={article.excerpt}
                  coverImage={article.cover_image_url}
                  author={{
                    name: article.profiles.name,
                    photo: article.profiles.photo_url || undefined,
                  }}
                   date={article.approved_at || article.created_at}
                  type="article"
                  categories={(articleCategories[article.id] || [])
                    .map((slug) => slugToName[slug])
                    .filter(Boolean)}
                  sequencePoints={parseSequencePoints(
                    article.sequence_points
                  )}
                />
              ))}
            </div>

         {/* Load More */}
{hasMore && (
  <div className="flex flex-col items-center justify-center mt-16 mb-8">
    <Button
      variant="ghost"
      type="button"
      onClick={fetchMoreArticles}
      disabled={loadingMore}
      className="group h-auto flex flex-col items-center gap-3 bg-transparent border-0 cursor-pointer disabled:cursor-wait"
    >
      {!loadingMore ? (
        <>
          <span className="animate-load-more text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors duration-300">
            المزيد من المقالات
          </span>

          <span className="flex flex-col items-center -space-y-1">
            <span className="animate-arrow-down text-muted-foreground/60 group-hover:text-primary transition-colors">
              ↓
            </span>

            <span
              className="animate-arrow-down text-muted-foreground/40 group-hover:text-primary/70 transition-colors"
              style={{ animationDelay: "150ms" }}
            >
              ↓
            </span>
          </span>
        </>
      ) : (
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          جاري تحميل المزيد...
        </span>
      )}
    </Button>
  </div>
)}



           
          </>
        )}
      </main>
    </div>
  );
};

export default Articles;
