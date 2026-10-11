import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, RefreshCw, UserRound } from "lucide-react";
import { serviceRequestStatusSchema } from "../../../supabase/functions/_shared/serviceRequestValidation";

const STATUSES = [
  { value: "new", label: "جديد" }, { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" }, { value: "rejected", label: "مرفوض" },
];

export default function ManageServiceRequests() {
  const [requests, setRequests] = useState<Tables<"service_requests">[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true); setFailed(false);
    const { data, error } = await supabase.from("service_requests").select("*").order("created_at", { ascending: false });
    if (error) { setFailed(true); toast({ title: "تعذّر تحميل الطلبات", variant: "destructive" }); }
    else setRequests(data || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const update = async (id: string, status: string) => {
    const parsed = serviceRequestStatusSchema.safeParse(status);
    if (!parsed.success || updating) return;
    setUpdating(id);
    const { data, error } = await supabase.from("service_requests").update({ status: parsed.data }).eq("id", id).select("id, status").single();
    if (error || !data) toast({ title: "تعذّر تحديث الحالة", variant: "destructive" });
    else setRequests((rows) => rows.map((row) => row.id === id ? { ...row, status: data.status } : row));
    setUpdating(null);
  };
  const visible = filter === "all" ? requests : requests.filter((row) => row.status === filter);
  return <div className="space-y-4" dir="rtl">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
      <h1 className="text-2xl font-bold">طلبات الخدمات</h1>
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الطلبات</SelectItem>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="تحديث الطلبات" title="تحديث الطلبات"><RefreshCw className="h-4 w-4" /></Button>
      </div>
    </div>
    {loading ? <p className="py-8 text-center text-muted-foreground">جارٍ تحميل الطلبات...</p> : failed ? <p role="alert" className="text-destructive">تعذّر تحميل الطلبات. حاول مرة أخرى.</p> : visible.length === 0 ? <p className="py-8 text-center text-muted-foreground">لا توجد طلبات في هذه الحالة.</p> : visible.map((row) => <Card key={row.id} className="shadow-none"><CardContent className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="font-bold">{row.service}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><UserRound className="h-4 w-4" />{row.name}</span><span className="break-all" dir="auto">{row.contact}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{new Date(row.created_at).toLocaleString("ar-SA")}</span></div>
        </div>
        <Select value={row.status} disabled={Boolean(updating)} onValueChange={(value) => void update(row.id, value)}><SelectTrigger className="w-40" aria-label="حالة الطلب"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>
      <p className="whitespace-pre-wrap break-words border-t pt-3 text-sm leading-7">{row.details}</p>
      {/* <p className="text-xs text-muted-foreground">الإشعار البريدي: {row.notification_status === "sent" ? "أُرسل" : row.notification_status === "failed" ? "تعذّر الإرسال" : "بانتظار الإرسال"}</p> */}
    </CardContent></Card>)}
  </div>;
}
