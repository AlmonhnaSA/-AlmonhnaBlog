import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
  created_at: string;
  author: {
    name: string;
    photo_url?: string;
  };
}


export const NewsSlider = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          author:profiles!articles_author_id_fkey(name, photo_url)
        `)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(5);

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

  useEffect(() => {
    if (news.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [news.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % news.length);
  };

  if (loading || news.length === 0) {
    return (
      <div className="relative h-[500px] bg-muted animate-pulse rounded-lg" />
    );
  }

  const currentNews = news[currentIndex];

  return (
  <div style={{borderRadius : '30px'}} className="relative h-[500px] sm:h-[400px] xs:h-[300px] overflow-hidden">
  <img
    src={currentNews.cover_image_url}
    alt={currentNews.title}
    className="absolute inset-0 w-full h-full object-fill object-center"
  />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      
      <div className="absolute bottom-0 right-0 left-0 p-8 text-white">
        <Link to={`/articles/${currentNews.id}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 hover:text-accent transition-colors">
            {currentNews.title}
          </h2>
        </Link>
        <p className="text-lg mb-4 line-clamp-2 opacity-90">
          {currentNews.excerpt}
        </p>
        <div className="flex items-center justify-between" style={{paddingTop:'5px'}}>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentNews.author?.photo_url} alt={currentNews.author?.name} />
              <AvatarFallback>{currentNews.author?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{currentNews.author?.name}</span>
          </div>
          <span className="text-sm opacity-80">
            {new Date(currentNews.created_at).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {news.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
