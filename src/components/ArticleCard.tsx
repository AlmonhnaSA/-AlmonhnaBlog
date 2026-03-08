import { Link } from "react-router-dom";
import { Calendar, User, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/ShareDialog";


interface ArticleCardProps {
  id: string;
  productType?: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: {
    name: string;
    photo?: string;
  };
  date: string;
  type: "article" | "news";
}

export const ArticleCard = ({
  id,
  title, productType,
  excerpt,
  coverImage,
  author,
  date,
  type,
}: ArticleCardProps) => {
  const formattedDate = new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const link = type === "article" ? `/articles/${id}` : `/news/${id}`;
const shareLink = type  === "article" ? "articles" :  "news"; 
  const fullUrl = `https://www.almonhna.sa${link}`;
  const badgeColor = "bg-primary";
  
  const truncatedExcerpt = excerpt.length > 50 ? excerpt.substring(0, 50) + "..." : excerpt;

  return (
    <>
      <Link to={link}>
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0">
          <div className="flex flex-row gap-4 p-4">
            <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-md bg-muted relative">
              <img
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {productType && (
                <Badge className={`absolute top-2 right-2 ${badgeColor} text-primary-foreground border-0`}>
                  <Star className="w-3 h-3 ml-1" />
                  {productType}
                </Badge>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <h3 className="text-xl font-bold leading-tight line-clamp-2 transition-colors mb-2">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                  {truncatedExcerpt}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 mt-auto">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarImage src={author.photo} alt={author.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{author.name}</span>
                </div>

                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pr-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                  </div>
<ShareButton
  url={`https://jkaccydmonmsarrsgajk.supabase.co/functions/v1/og-share?type=articles&id=${id}`}
  title={title}
/>                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </>
  );
};
