import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

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
      console.error("Error loading services:", error);
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

  if (loading) {
    return (
      <div className="relative h-[500px] bg-muted animate-pulse rounded-lg" />
    );
  }

  if (news.length === 0) return null;

  const currentNews = news[currentIndex];

  return (
  <div className="services-editorial group relative h-[520px] overflow-hidden md:h-[620px]">
  <img
    src={currentNews.cover_image_url}
    alt={currentNews.title}
    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-1000 group-hover:scale-[1.025]"
  />
      <div className="services-editorial-shade absolute inset-0" />
      
      <div className="services-editorial-copy absolute bottom-0 right-0 left-0 p-7 md:p-12">
        <Link to={`/articles/${currentNews.id}`}>
          <h3 className="max-w-4xl text-3xl font-bold leading-snug transition-transform duration-500 group-hover:-translate-y-1 md:text-5xl">
            {currentNews.title}
          </h3>
        </Link>
        <p className="mb-5 mt-4 max-w-2xl text-base leading-relaxed opacity-85 md:text-lg">
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
          <span className="hidden text-sm opacity-80 sm:block">
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
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/20 text-primary-foreground opacity-0 backdrop-blur-md transition-opacity hover:bg-background/30 group-hover:opacity-100"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/20 text-primary-foreground opacity-0 backdrop-blur-md transition-opacity hover:bg-background/30 group-hover:opacity-100"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="absolute left-7 top-7 flex gap-2 md:left-12 md:top-12">
        {news.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`الخدمة ${index + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? "w-10 bg-primary" : "w-4 bg-primary-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
