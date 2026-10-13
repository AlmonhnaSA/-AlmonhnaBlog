import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareDialog";
import { readingTimeMinutes } from "@/lib/articleExtras";

const sequence = (value: unknown): string[] =>
  Array.isArray(value)
    ? (value as Array<string | { title?: string }>).map((item) => typeof item === "string" ? item : item?.title || "").filter(Boolean)
    : [];

export interface LatestArticleCardData {
  id: string;
  title: string;
  excerpt: string | null;
  content?: string | null;
  cover_image_url: string;
  created_at: string;
  approved_at?: string | null;
  sequence_points?: unknown;
  profiles?: { id?: string; name?: string; photo_url?: string | null } | null;
}

interface LatestArticleCardProps {
  article: LatestArticleCardData;
  categories?: string[];
  className?: string;
}

export const LatestArticleCard = ({ article, categories = [], className }: LatestArticleCardProps) => {
  const points = sequence(article.sequence_points);
  const date = new Date(article.approved_at || article.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
  const articleUrl = `/articles/${article.id}`;
  const publicUrl = `https://www.almonhna.sa${articleUrl}`;

  return (
    <article className={`latest-article-card${className ? ` ${className}` : ""}`}>
      <Link to={articleUrl} className="latest-card-main" aria-label={article.title}>
        <div className="latest-card-media">
          <img src={article.cover_image_url} alt={article.title} loading="lazy" />
          <span className="latest-reading-time"><Clock className="h-3.5 w-3.5" />{readingTimeMinutes(article.content || "")} دقائق</span>
        </div>
        <div className="latest-card-copy">
          <h3>{article.title}</h3>
          <p>{article.excerpt}</p>
          {points.length > 0 && (
            <div className="latest-sequence" aria-label="تسلسل المقال">
              {points.slice(0, 3).map((point: string, pointIndex: number) => <span key={`${point}-${pointIndex}`}>{point}</span>)}
            </div>
          )}
        </div>
      </Link>

      <footer className="latest-card-footer">
        <Link to={article.profiles?.id ? `/writers/${article.profiles.id}` : "#"} className="latest-card-author">
          {article.profiles?.photo_url ? <img src={article.profiles.photo_url} alt={article.profiles?.name || "الكاتب"} /> : <span>{article.profiles?.name?.charAt(0)}</span>}
          <strong>{article.profiles?.name}</strong>
        </Link>
        <time dateTime={article.approved_at || article.created_at}>{date}</time>
        {categories.length > 0 && <div className="latest-card-categories">{categories.slice(0, 3).map((category) => <span key={category}>{category}</span>)}</div>}

        <div className="latest-card-actions">
          <ShareButton url={`https://www.almonhna.sa/api/og-share?type=articles&id=${article.id}&v=1`} displayUrl={publicUrl} title={article.title} />
          <BookmarkButton size="sm" item={{ id: article.id, type: "article", title: article.title, excerpt: article.excerpt || "", coverImage: article.cover_image_url, authorName: article.profiles?.name || "" }} />
          <LikeButton contentId={article.id} contentType="article" />
        </div>
      </footer>
    </article>
  );
};

export default LatestArticleCard;
