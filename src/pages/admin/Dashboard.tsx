import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileText, Newspaper, Users, Clock, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("name, photo_url")
        .eq("user_id", userData.user.id)
        .single();

      if (error) throw error;
      if (data?.photo_url) setPhotoUrl(data.photo_url);
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [articlesCount, newsCount, writersCount, pendingArticles, pendingNews, pendingWriters] = await Promise.all([
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("news").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("news").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      return {
        articles: articlesCount.count || 0,
        news: newsCount.count || 0,
        writers: writersCount.count || 0,
        pendingArticles: pendingArticles.count || 0,
        pendingNews: pendingNews.count || 0,
        pendingWriters: pendingWriters.count || 0,
      };
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async (newPhotoUrl: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not found");

      const { error } = await supabase
        .from("profiles")
        .update({ photo_url: newPhotoUrl })
        .eq("user_id", userData.user.id);

      if (error) throw error;
      return newPhotoUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث الصورة بنجاح",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل تحديث الصورة",
        variant: "destructive",
      });
    },
  });

  const handleSavePhoto = () => {
    if (photoUrl) {
      updatePhotoMutation.mutate(photoUrl);
    }
  };

  const statCards = [
    { title: "المقالات", count: stats?.articles, icon: FileText, color: "text-blue-500", link: "/admin/articles" },
    { title: "خدماتنا", count: stats?.news, icon: Newspaper, color: "text-green-500", link: "/admin/news" },
    { title: "الكتاب", count: stats?.writers, icon: Users, color: "text-purple-500", link: "/admin/writers" },
    { title: "مقالات معلقة", count: stats?.pendingArticles, icon: Clock, color: "text-orange-500", link: "/admin/articles?status=pending" },
    { title: "خدمات معلقة", count: stats?.pendingNews, icon: Clock, color: "text-orange-500", link: "/admin/news?status=pending" },
    { title: "كتاب معلقين", count: stats?.pendingWriters, icon: Clock, color: "text-red-500", link: "/admin/writers?status=pending" },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile?.photo_url || ""} alt={profile?.name || "Admin"} />
            <AvatarFallback>{profile?.name?.[0] || "A"}</AvatarFallback>
          </Avatar>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 rounded-full w-8 h-8"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تعديل الصورة الشخصية</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <ImageUpload
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  label="الصورة الشخصية"
                />
                <Button
                  onClick={handleSavePhoto}
                  disabled={updatePhotoMutation.isPending}
                  className="w-full"
                >
                  {updatePhotoMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div>
          <h1 className="text-3xl font-bold">مرحباً، {profile?.name}</h1>
          <p className="text-muted-foreground">لوحة التحكم</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.link}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.count}</p>
                  </div>
                  <Icon className={`w-12 h-12 ${stat.color}`} />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;