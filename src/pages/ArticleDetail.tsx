import { useParams, Link } from "react-router-dom";
import { cleanContentFont } from "@/lib/cleanContent";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Calendar, User, Eye, Share2 } from "lucide-react";
import { useEffect } from "react";
import { ShareButton } from "@/components/ShareDialog";
import { ArticleCard } from "@/components/ArticleCard";


const ArticleDetail = () => {
  const { id } = useParams();

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
    document.title = `${article.title} - المُنحنى`;
    setMeta("description", article.excerpt);
    setMeta("og:type", "article");
    setMeta("og:title", article.title);
    setMeta("og:description", article.excerpt);
    setMeta("og:image", article.cover_image_url);
    setMeta("og:url", articleUrl);
    setMeta("og:site_name", "المُنحنى");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", article.title);
    setMeta("twitter:description", article.excerpt);
    setMeta("twitter:image", article.cover_image_url);

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
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">المقال غير موجود</h1>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="w-full h-96 object-cover rounded-lg mb-6"
        />

        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center gap-6 text-muted-foreground mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(article.created_at).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</span>
          </div>
          {article.products && (
            <Link
              to={`/products/${article.products.id}`}
              className="text-accent hover:underline"
            >
              {article.products.name}
            </Link>
          )}
          <ShareButton
            url={`https://jkaccydmonmsarrsgajk.supabase.co/functions/v1/og-share?type=articles&id=${id}`}
            displayUrl={`https://almonhna.sa/articles/${id}`}
            title={article.title}
            iconSize={20}
            className="mr-auto"
          />
        </div>

        <Link
          to={`/writers/${article.profiles.id}`}
          className="flex items-center gap-3 mb-8 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          {article.profiles.photo_url ? (
            <img
              src={article.profiles.photo_url}
              alt={article.profiles.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <p className="font-semibold">{article.profiles.name}</p>
            {article.profiles.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {article.profiles.bio}
              </p>
            )}
          </div>
        </Link>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-muted-foreground mb-6">{article.excerpt}</p>
          {/* <div className="site-content" style={{padding:"5px" , backgroundColor:"#f5f0e1d1" , fontSize :"15px !important"}} dangerouslySetInnerHTML={{ __html: cleanContentFont(article.content) }} /> */}
      <div
  className="
    site-content
    [&_*]:!font-sans
    [&_*]:!text-gray-900
    [&_h1]:!text-3xl
    [&_h2]:!text-2xl
    [&_h3]:!text-xl
    [&_*]:!text-[17px]
        [&_*]:!leading-[1.9]
  "
        style={{padding:"5px" , backgroundColor:"#f5f0e1d1"}}
  dangerouslySetInnerHTML={{ __html: article.content }}
/>
        </div>
      </article>

      {relatedArticles && relatedArticles.length > 0 && (
        <section className="container mx-auto px-4 pb-12 max-w-4xl">
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
