import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const ManageProductRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: "" });
  const [rejectNote, setRejectNote] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-product-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_requests")
        .select("*, store_products(name, image_url), profiles(name, email, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_note }: { id: string; status: string; admin_note?: string }) => {
      const { error } = await supabase
        .from("product_requests")
        .update({ status, admin_note: admin_note || null, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-requests"] });
      toast({ title: "تم تحديث الطلب" });
    },
  });

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, status: "approved" });
  };

  const handleReject = () => {
    updateMutation.mutate({ id: rejectDialog.requestId, status: "rejected", admin_note: rejectNote });
    setRejectDialog({ open: false, requestId: "" });
    setRejectNote("");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pending: { label: "قيد المراجعة", variant: "secondary" },
      approved: { label: "تمت الموافقة", variant: "default" },
      rejected: { label: "مرفوض", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">طلبات المنتجات</h1>

      {requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <Card key={req.id} className="p-4">
              <div className="flex items-start gap-4">
                {req.store_products?.image_url && (
                  <img src={req.store_products.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{req.store_products?.name || "منتج محذوف"}</h3>
                    {statusBadge(req.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {req.profiles?.name}
                    </span>
                    {req.profiles?.email && <span>{req.profiles.email}</span>}
                    {req.profiles?.phone && <span>{req.profiles.phone}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  {req.admin_note && (
                    <p className="text-sm text-muted-foreground bg-muted rounded p-2 mt-1">ملاحظة: {req.admin_note}</p>
                  )}
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleApprove(req.id)} disabled={updateMutation.isPending}>
                      <CheckCircle className="w-4 h-4 ml-1" />
                      موافقة
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejectDialog({ open: true, requestId: req.id })}
                      disabled={updateMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 ml-1" />
                      رفض
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">لا توجد طلبات حالياً</p>
      )}

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="سبب الرفض (اختياري)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setRejectDialog({ open: false, requestId: "" })}>إلغاء</Button>
            <Button variant="destructive" size="sm" onClick={handleReject}>تأكيد الرفض</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProductRequests;
