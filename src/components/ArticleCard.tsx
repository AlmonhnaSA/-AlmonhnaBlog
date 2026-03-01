import { Link } from "react-router-dom";
import { Calendar, User, Star, Share2, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const SHARE_PLATFORMS = [
  {
    name: "واتساب",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    getUrl: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`,
  },
  {
    name: "تيليجرام",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#0088cc">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    getUrl: (url: string, title: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "X",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    getUrl: (url: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "لينكدإن",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#0A66C2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    getUrl: (url: string, title: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
];

export const ArticleCard = ({
  id,
  title, productType,
  excerpt,
  coverImage,
  author,
  date,
  type,
}: ArticleCardProps) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const link = type === "article" ? `/articles/${id}` : `/news/${id}`;
  const fullUrl = `${window.location.origin}${link}`;
  const badgeColor = "bg-primary";
  
  const truncatedExcerpt = excerpt.length > 50 ? excerpt.substring(0, 50) + "..." : excerpt;

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePlatformShare = (getUrl: (url: string, title: string) => string) => {
    window.open(getUrl(fullUrl, title), "_blank", "noopener,noreferrer,width=600,height=400");
  };

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
                  <button
                    onClick={handleShareClick}
                    className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                    title="مشاركة"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">مشاركة</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center gap-6 py-4">
            {SHARE_PLATFORMS.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handlePlatformShare(platform.getUrl)}
                className="flex flex-col items-center gap-2 group/icon"
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                  {platform.icon}
                </div>
                <span className="text-xs text-muted-foreground">{platform.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-muted rounded-lg p-2 mt-2">
            <input
              type="text"
              value={fullUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-foreground outline-none px-2 truncate"
              dir="ltr"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  نسخ
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
