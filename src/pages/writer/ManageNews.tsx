import { useDashboardSearch } from "@/components/DashboardSearch";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface News {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
  content: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export const ManageNews = () => {
  const search = useDashboardSearch();
  const [news, setNews] = useState<News[]>([]);
  const [rejectionPopup, setRejectionPopup] = useState<{ open: boolean; reason: string }>({ open: false, reason: "" });
  const { toast } = useToast();

  useEffect(() => {
    loadProfileAndNews();
  }, []);

  const loadProfileAndNews = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    const { data } = await supabase
      .from("news")
      .select("*")
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false });

    if (data) setNews(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;

    const { error } = await supabase.from("news").delete().eq("id", id);

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الخدمة", variant: "destructive" });
      return;
    }

    toast({ title: "تم الحذف", description: "تم حذف الخدمة بنجاح" });
    loadProfileAndNews();
  };

  const handleResubmit = async (id: string) => {
    const { error } = await supabase
      .from("news")
      .update({ status: "pending" as any, rejection_reason: null })
      .eq("id", id);

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إعادة الإرسال", variant: "destructive" });
      return;
    }

    toast({ title: "تم الإرسال", description: "تم إعادة إرسال الخدمة للمراجعة" });
    loadProfileAndNews();
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    const labels = {
      pending: "قيد المراجعة",
      approved: "موافق عليه",
      rejected: "مرفوض",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">خدماتي</h1>
        <Link to="/writer/news/add">
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            إضافة خدمة جديدة
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {search(news).map((newsItem) => (
          <Card key={newsItem.id}>
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <img src={newsItem.cover_image_url} alt={newsItem.title} className="w-32 h-24 object-cover rounded-lg" />
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{newsItem.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{newsItem.excerpt}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(newsItem.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(newsItem.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {newsItem.status === "rejected" && newsItem.rejection_reason && (
                    <button
                      onClick={() => setRejectionPopup({ open: true, reason: newsItem.rejection_reason! })}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline cursor-pointer"
                    >
                      عرض سبب الرفض
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link to={`/writer/news/preview/${newsItem.id}`}>
                    <Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button>
                  </Link>
                  <Link to={`/writer/news/edit/${newsItem.id}`}>
                    <Button variant="outline" size="sm"><Pencil className="w-4 h-4" /></Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(newsItem.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={rejectionPopup.open} onOpenChange={(open) => setRejectionPopup({ ...rejectionPopup, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سبب الرفض</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" dir="rtl">{rejectionPopup.reason}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageNews;
