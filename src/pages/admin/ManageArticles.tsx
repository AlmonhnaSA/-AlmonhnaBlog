import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Trash2, Eye, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const ManageArticles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-articles", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select(`
          *,
          profiles:author_id (name),
          products (name)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "approved" | "pending" | "rejected");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: "approved" | "pending" | "rejected"; rejection_reason?: string }) => {
      const updateData: any = { status };
      if (rejection_reason !== undefined) {
        updateData.rejection_reason = rejection_reason;
      }
      if (status === "approved") {
        updateData.rejection_reason = null;
      }
      const { error } = await supabase
        .from("articles")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "تم التحديث بنجاح", description: "تم تحديث حالة المقال" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث حالة المقال", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "تم الحذف بنجاح", description: "تم حذف المقال" });
    },
  });

  const handleReject = (id: string) => {
    setRejectingId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!rejectingId || !rejectionReason.trim()) {
      toast({ title: "خطأ", description: "يرجى كتابة سبب الرفض", variant: "destructive" });
      return;
    }
    updateStatusMutation.mutate(
      { id: rejectingId, status: "rejected", rejection_reason: rejectionReason.trim() },
      { onSuccess: () => { setRejectDialogOpen(false); setRejectingId(null); setRejectionReason(""); } }
    );
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">إدارة المقالات</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles?.map((article) => (
          <Card key={article.id} className="p-6">
            <div className="flex gap-4">
              <img src={article.cover_image_url} alt={article.title} className="w-32 h-32 object-cover rounded" />
              <div className="flex-1">
                <Link to={`/articles/${article.id}`} className="font-bold text-lg hover:text-primary">{article.title}</Link>
                <p className="text-sm text-muted-foreground mt-1">{article.excerpt}</p>
                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                  <span>الكاتب: {article.profiles.name}</span>
                  {article.products && <span>المنتج: {article.products.name}</span>}
                  <span>
                    الحالة:{" "}
                    <span className={`font-semibold ${article.status === "approved" ? "text-green-500" : article.status === "rejected" ? "text-red-500" : "text-orange-500"}`}>
                      {article.status === "approved" ? "مقبول" : article.status === "rejected" ? "مرفوض" : "معلق"}
                    </span>
                  </span>
                </div>

                {article.status === "rejected" && article.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>سبب الرفض:</strong> {article.rejection_reason}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <div className="relative group inline-block">
                    <Link to={`/admin/articles/preview/${article.id}`}>
                      <Button className="pl-1 hover:bg-gray-200 hover:text-black" variant="outline" size="sm"><Eye className="w-4 h-4 ml-2" /></Button>
                    </Link>
                    <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">عرض</span>
                  </div>
                  <div className="relative group inline-block">
                    <Link to={`/admin/articles/edit/${article.id}`}>
                      <Button className="pl-1 hover:bg-gray-200 hover:text-black" variant="outline" size="sm"><Pencil className="w-4 h-4 ml-2" /></Button>
                    </Link>
                    <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">تعديل</span>
                  </div>
                  {article.status === "pending" && (
                    <>
                      <Button className="p-2" variant="default" size="sm" onClick={() => updateStatusMutation.mutate({ id: article.id, status: "approved" })}>
                        <Check className="w-4 h-4 ml-2" />قبول
                      </Button>
                      <Button className="p-2" variant="destructive" size="sm" onClick={() => handleReject(article.id)}>
                        <X className="w-4 h-4 ml-2" />رفض
                      </Button>
                    </>
                  )}
                  <div className="relative group inline-block">
                    <Button className="pl-1 hover:bg-gray-200 hover:text-black" variant="outline" size="sm" onClick={() => deleteMutation.mutate(article.id)}>
                      <Trash2 className="w-4 h-4 ml-2" />
                    </Button>
                    <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">حذف</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {articles?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">لا توجد نتائج</p>
        )}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سبب رفض المقال</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="اكتب سبب الرفض هنا..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
            dir="rtl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={updateStatusMutation.isPending}>
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageArticles;
