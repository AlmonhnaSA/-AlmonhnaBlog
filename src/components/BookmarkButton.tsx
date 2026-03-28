import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmarks, BookmarkItem } from "@/hooks/useBookmarks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  item: Omit<BookmarkItem, "savedAt">;
  className?: string;
  size?: "sm" | "default";
}

export const BookmarkButton = ({ item, className, size = "default" }: BookmarkButtonProps) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(item.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(item);
    toast.success(saved ? "تم إزالة العلامة المرجعية" : "تم حفظ المقال للقراءة لاحقاً", {
      duration: 2000,
    });
  };

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "sm" : "default"}
      onClick={handleClick}
      className={cn(
        "gap-1.5 text-muted-foreground hover:text-primary transition-colors",
        saved && "text-primary",
        className
      )}
      title={saved ? "إزالة من المحفوظات" : "حفظ لوقت لاحق"}
    >
      {saved ? (
        <BookmarkCheck className="w-5 h-5 fill-primary" />
      ) : (
        <Bookmark className="w-5 h-5" />
      )}
    </Button>
  );
};
