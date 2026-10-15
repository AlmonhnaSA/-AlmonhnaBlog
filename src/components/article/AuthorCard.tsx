import { Link } from "react-router-dom";
import { User, ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

interface AuthorCardProps {
  id: string;
  name: string;
  photo?: string | null;
  bio?: string | null;
  articlesCount?: number;
}

export const AuthorCard = ({ id, name, photo, bio, articlesCount }: AuthorCardProps) => (
  <Reveal className="ArticleContainer container mx-auto px-4 pb-12 max-w-4xl">
    <div className="rounded-2xl surface-alt border border-border/60 p-4 sm:p-6 md:p-8 flex flex-row items-start gap-3 sm:gap-5">
      {photo ? (
        <img src={photo} alt={name} className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
          <User className="w-9 h-9 text-brand" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground mb-1">كتب هذا المقال</p>
        <p className="text-lg sm:text-xl font-semibold text-brand">{name}</p>
        {bio && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{bio}</p>}
        <Link
          to={`/writers/${id}`}
          className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-brand hover:gap-3 transition-all"
        >
          {typeof articlesCount === "number" ? `تصفح ${articlesCount} مقال للكاتب` : "تصفح مقالات الكاتب"}
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </Reveal>
);

export default AuthorCard;
