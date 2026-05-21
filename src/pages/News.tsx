import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { ArticleCard } from "@/components/ArticleCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
  created_at: string;
  profiles: {
    id: string;
    name: string;
    photo_url: string | null;
  };
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from("news")
        .select(`
          *,
          profiles (
            id,
            name,
            photo_url
          )
        `)
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل خدماتنا",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      
      <main className="container mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">جميع خدماتنا</h1>
          <p className="text-muted-foreground">تابع آخر خدماتنا والتحديثات على المُنحنى</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">لا توجد خدمات منشورة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map((item) => (
              <ArticleCard
                key={item.id}
                id={item.id}
                title={item.title}
                excerpt={item.excerpt}
                coverImage={item.cover_image_url}
                author={{
                  name: item.profiles.name,
                  photo: item.profiles.photo_url || undefined,
                }}
                date={item.created_at}
                type="news"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default News;
