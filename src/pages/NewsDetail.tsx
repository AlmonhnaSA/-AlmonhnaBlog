import { useParams, Link } from "react-router-dom";
import { cleanContentFont } from "@/lib/cleanContent";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Calendar, User, Eye } from "lucide-react";
import { ShareButton } from "@/components/ShareDialog";
import { useEffect } from "react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { LikeButton } from "@/components/LikeButton";

const NewsDetail = () => {
  const { id } = useParams();

  const { data: news, isLoading } = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select(`
          *,
          profiles:author_id (
            id,
            name,
            photo_url,
            bio
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
    if (news) {
      const incrementViews = async () => {
        await supabase
          .from("news")
          .update({ views: (news.views || 0) + 1 })
          .eq("id", id);
      };
      incrementViews();
    }
  }, [news, id]);

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

  if (!news) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">الخدمة غير موجودة</h1>
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
          src={news.cover_image_url}
          alt={news.title}
          className="w-full h-96 object-cover rounded-lg mb-6"
        />

        <h1 className="text-4xl font-bold mb-4">{news.title}</h1>

        <div className="flex items-center gap-6 text-muted-foreground mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(news.created_at).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</span>
          </div>
          <ShareButton
            url={`https://almonhna.sa/api/og-share?type=news&id=${id}`}
            displayUrl={`https://almonhna.sa/news/${id}`}
            title={news.title}
            iconSize={20}
          />
          <BookmarkButton
            item={{
              id: news.id,
              type: "news",
              title: news.title,
              excerpt: news.excerpt,
              coverImage: news.cover_image_url,
              authorName: news.profiles?.name || "",
            }}
          />
          <LikeButton
            contentId={news.id}
            contentType="news"
            className="mr-auto"
          />
        </div>

        <Link
          to={`/writers/${news.profiles.id}`}
          className="flex items-center gap-3 mb-8 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          {news.profiles.photo_url ? (
            <img
              src={news.profiles.photo_url}
              alt={news.profiles.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <p className="font-semibold">{news.profiles.name}</p>
            {news.profiles.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {news.profiles.bio}
              </p>
            )}
          </div>
        </Link>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-muted-foreground mb-6" style={{textAlign: "justify"}}>{news.excerpt}</p>
          <div className="site-content" dangerouslySetInnerHTML={{ __html: cleanContentFont(news.content) }} />
        </div>
      </article>
    </div>
  );
};

export default NewsDetail;
