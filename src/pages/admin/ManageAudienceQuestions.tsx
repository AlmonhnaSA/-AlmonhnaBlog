import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Mail, Trash2, UserRound } from "lucide-react";

const STATUSES: { value: string; label: string }[] = [
  { value: "new", label: "جديد" },
  { value: "under_review", label: "قيد الدراسة" },
  { value: "in_progress", label: "قيد الكتابة" },
  { value: "published", label: "أصبح محتوى" },
  { value: "archived", label: "مؤرشف" },
];

const ManageAudienceQuestions = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    const [{ data: qs }, { data: arts }] = await Promise.all([
      supabase.from("audience_questions").select("*").order("created_at", { ascending: false }),
      supabase.from("articles").select("id, title").eq("status", "approved").order("created_at", { ascending: false }).limit(200),
    ]);
    setQuestions(qs || []);
    setArticles(arts || []);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from("audience_questions").update(patch).eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "تعذّر التحديث", variant: "destructive" });
      return;
    }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا السؤال؟")) return;
    await supabase.from("audience_questions").delete().eq("id", id);
    load();
  };

  const visible = filter === "all" ? questions : questions.filter((q) => q.status === filter);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">أسئلة الجمهور</h1>
          <p className="mt-1 text-sm text-muted-foreground">متابعة الأسئلة وربطها بالمقالات المنشورة</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأسئلة</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visible.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد أسئلة في هذه الحالة.</CardContent></Card>
      )}

      <div className="space-y-2">
        {visible.map((q) => (
        <Card key={q.id} className="overflow-hidden shadow-none transition-colors hover:border-primary/50">
          <CardContent className="p-3 sm:p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_minmax(360px,1.15fr)_auto] xl:items-center">
              <div className="min-w-0 border-r-2 border-primary pr-3">
                <h2 className="text-[15px] font-bold leading-7 sm:text-base">{q.question}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{q.name || "بدون اسم"}</span>
                  <span className="inline-flex min-w-0 items-center gap-1" dir="ltr"><Mail className="h-3.5 w-3.5 shrink-0" />{q.email || "بدون بريد"}</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(q.created_at).toLocaleDateString("ar-EG")}</span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[150px_minmax(220px,1fr)]">
                <Select value={q.status} onValueChange={(v) => update(q.id, { status: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={q.linked_article_id || "none"}
                  onValueChange={(v) => update(q.id, { linked_article_id: v === "none" ? null : v })}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="اربط بمقال منشور" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مقال</SelectItem>
                    {articles.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="ghost" size="icon" onClick={() => remove(q.id)} className="h-9 w-9 justify-self-end text-destructive hover:text-destructive" aria-label="حذف السؤال" title="حذف السؤال">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  );
};

export default ManageAudienceQuestions;
