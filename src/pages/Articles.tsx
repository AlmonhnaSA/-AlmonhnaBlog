import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { ArticleCard } from "@/components/ArticleCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Article {
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

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
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
        .order("approved_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
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

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      
      <main className="container mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">جميع المقالات</h1>
          <p className="text-muted-foreground">تصفح جميع المقالات المنشورة على المُنحنى</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">لا توجد مقالات منشورة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                title={article.title}
                excerpt={article.excerpt}
                coverImage={article.cover_image_url}
                author={{
                  name: article.profiles.name,
                  photo: article.profiles.photo_url || undefined,
                }}
                date={article.created_at}
                type="article"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Articles;
