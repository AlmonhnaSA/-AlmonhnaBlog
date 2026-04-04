import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { useBookmarks } from "@/hooks/useBookmarks";
import { ArticleCard } from "@/components/ArticleCard";
import { Bookmark } from "lucide-react";

const Bookmarks = () => {
  const { bookmarks } = useBookmarks();

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold">المحفوظات</h1>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              لا توجد مقالات محفوظة
            </h2>
            <p className="text-muted-foreground">
              اضغط على أيقونة العلامة المرجعية لحفظ المقالات والأخبار لقراءتها لاحقاً
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookmarks.map((item) => (
              <ArticleCard
                key={item.id}
                id={item.id}
                title={item.title}
                excerpt={item.excerpt}
                coverImage={item.coverImage}
                author={{ name: item.authorName }}
                date={item.savedAt}
                type={item.type}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
