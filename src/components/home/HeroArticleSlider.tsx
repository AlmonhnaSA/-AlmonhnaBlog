import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const HeroArticleSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["hero-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, excerpt, cover_image_url, approved_at, created_at, profiles:author_id(name, photo_url)")
        .eq("status", "approved")
        .order("approved_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (articles.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % articles.length), 7000);
    return () => window.clearInterval(timer);
  }, [articles.length]);

  useEffect(() => {
    if (activeIndex >= articles.length) setActiveIndex(0);
  }, [activeIndex, articles.length]);

  if (isLoading) return <div className="hero-article-slider hero-article-loading" aria-hidden="true" />;
  if (!articles.length) return null;

  const article = articles[activeIndex];
  const author = Array.isArray(article.profiles) ? article.profiles[0] : article.profiles;

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + articles.length) % articles.length);
  };

  return (
    <div className="hero-article-slider group" aria-roledescription="عارض مقالات">
      <Link key={article.id} to={`/articles/${article.id}`} className="hero-article-slide">
        <img src={article.cover_image_url} alt={article.title} />
        <span className="hero-article-shade" aria-hidden="true" />
       
      </Link>

    
    </div>
  );
};

export default HeroArticleSlider;
