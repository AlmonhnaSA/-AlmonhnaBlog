import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryImageTrack } from "@/components/GalleryImageTrack";

interface GalleryArticle {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
}

export const ColumnArticleGallery = ({ articles, isQuote }: { articles: GalleryArticle[]; isQuote: boolean }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => { setActiveIndex(0); }, [articles]);
  const active = articles[activeIndex] || articles[0];
  if (!active) return null;
  const move = (step: number) => setActiveIndex((index) => Math.max(0, Math.min(articles.length - 1, index + step)));

  return (
    <section className="column-gallery" aria-label={isQuote ? "مقتبسات العمود" : "صور العمود"}>
      <div className="column-gallery-stage">
        <GalleryImageTrack images={articles.map((article) => ({ src: article.cover_image_url, alt: article.title, href: `/articles/${article.id}` }))} index={activeIndex} onSelect={setActiveIndex} />
        <Link to={`/articles/${active.id}`} className="column-gallery-feature">
          <div className="column-gallery-caption">
            <h2>{active.title}</h2>
            {active.excerpt && <p>{active.excerpt}</p>}
          </div>
        </Link>
        {articles.length > 1 && <>
          <Button variant="outline" size="icon" className="column-gallery-arrow column-gallery-arrow-prev" aria-label="السابق" title="السابق" disabled={activeIndex === 0} onClick={() => move(-1)}><ChevronRight className="h-5 w-5" /></Button>
          <Button variant="outline" size="icon" className="column-gallery-arrow column-gallery-arrow-next" aria-label="التالي" title="التالي" disabled={activeIndex === articles.length - 1} onClick={() => move(1)}><ChevronLeft className="h-5 w-5" /></Button>
        </>}
      </div>
      <h3 className="column-gallery-archive-title">{isQuote ? "مقتبسات سابقة" : "صور سابقة"}</h3>
      <div className="column-gallery-thumbnails">
        {articles.map((article, index) => (
          <Button key={article.id} variant="ghost" className="column-gallery-thumbnail" aria-label={article.title} title={article.title} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}>
            <img src={article.cover_image_url} alt={article.title} loading="lazy" decoding="async" />
          </Button>
        ))}
      </div>
    </section>
  );
};