import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Newspaper, Clock, CheckCircle, User, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export const WriterDashboard = () => {
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalNews: 0,
    pendingArticles: 0,
    pendingNews: 0,
    approvedArticles: 0,
    approvedNews: 0,
  });
  const [profile, setProfile] = useState<{ name: string; photo_url?: string } | null>(null);
  const [likedContent, setLikedContent] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, photo_url")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;
    setProfile({ name: profile.name, photo_url: profile.photo_url || undefined });

    const [articles, news] = await Promise.all([
      supabase.from("articles").select("status").eq("author_id", profile.id),
      supabase.from("news").select("status").eq("author_id", profile.id),
    ]);

    const articlesData = articles.data || [];
    const newsData = news.data || [];

    setStats({
      totalArticles: articlesData.length,
      totalNews: newsData.length,
      pendingArticles: articlesData.filter(a => a.status === "pending").length,
      pendingNews: newsData.filter(n => n.status === "pending").length,
      approvedArticles: articlesData.filter(a => a.status === "approved").length,
      approvedNews: newsData.filter(n => n.status === "approved").length,
    });

    // Load likes on writer's content
    const { data: writerArticles } = await supabase
      .from("articles")
      .select("id, title, cover_image_url")
      .eq("author_id", profile.id)
      .eq("status", "approved");

    const { data: writerNews } = await supabase
      .from("news")
      .select("id, title, cover_image_url")
      .eq("author_id", profile.id)
      .eq("status", "approved");

    const allContentIds = [
      ...(writerArticles || []).map(a => a.id),
      ...(writerNews || []).map(n => n.id),
    ];

    if (allContentIds.length > 0) {
      const { data: likes } = await supabase
        .from("content_likes")
        .select("content_id, content_type")
        .in("content_id", allContentIds);

      // Count likes per content
      const likeCounts: Record<string, number> = {};
      (likes || []).forEach(l => {
        likeCounts[l.content_id] = (likeCounts[l.content_id] || 0) + 1;
      });

      const likedItems = [
        ...(writerArticles || []).filter(a => likeCounts[a.id]).map(a => ({
          ...a, type: "article" as const, likes: likeCounts[a.id],
        })),
        ...(writerNews || []).filter(n => likeCounts[n.id]).map(n => ({
          ...n, type: "news" as const, likes: likeCounts[n.id],
        })),
      ].sort((a, b) => b.likes - a.likes);

      setLikedContent(likedItems);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile?.photo_url} alt={profile?.name} />
          <AvatarFallback>
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold mb-2">{profile?.name || "الكاتب"}</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة تحكم الكاتب</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المقالات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخدمات</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مقالات قيد المراجعة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">خدمات قيد المراجعة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingNews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مقالات موافق عليها</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">خدمات موافق عليها</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedNews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liked content section */}
      {likedContent.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive" />
            المحتوى الذي نال إعجاب القراء
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {likedContent.map((item) => (
              <Link
                key={item.id}
                to={`/${item.type === "article" ? "articles" : "news"}/${item.id}`}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
              >
                <img
                  src={item.cover_image_url}
                  alt={item.title}
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.type === "article" ? "مقال" : "خدمة"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-destructive shrink-0">
                  <Heart className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{item.likes}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WriterDashboard;
