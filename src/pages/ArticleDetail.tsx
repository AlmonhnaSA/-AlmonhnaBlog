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
            url={window.location.href}
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
    </div>
  );
};

export default ArticleDetail;
