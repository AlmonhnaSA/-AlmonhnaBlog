import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLikes } from "@/hooks/useLikes";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  contentId: string;
  contentType: "article" | "news";
  className?: string;
}

export const LikeButton = ({ contentId, contentType, className }: LikeButtonProps) => {
  const { likeCount, isLiked, toggleLike, loading } = useLikes(contentId, contentType);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLike();
      }}
      disabled={loading}
      className={cn(
        "gap-1.5 text-muted-foreground hover:text-red-500 transition-colors",
        isLiked && "text-red-500",
        className
      )}
      title={isLiked ? "إلغاء الإعجاب" : "إعجاب"}
    >
      <Heart className={cn("w-5 h-5", isLiked && "fill-red-500")} />
      {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
    </Button>
  );
};
