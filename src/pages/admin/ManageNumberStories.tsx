import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Plus } from "lucide-react";

interface NumberStory {
  id: string;
  number_value: string;
  title: string;
  description: string;
  source: string;
  story_date: string;
  link_url: string;
  is_active: boolean;
}

const ManageNumberStories = () => {
  const [items, setItems] = useState<NumberStory[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("number_stories").select("*").order("display_order");
    setItems(
      (data || []).map((n: any) => ({
        id: n.id,
        number_value: n.number_value || "",
        title: n.title || "",
        description: n.description || "",
        source: n.source || "",
        story_date: n.story_date || "",
        link_url: n.link_url || "",
        is_active: n.is_active,
      })),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const patch = (id: string, p: Partial<NumberStory>) =>
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const { data: first } = await supabase
      .from("number_stories")
      .select("display_order")
      .order("display_order")
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from("number_stories")
      .insert({ title: newTitle.trim(), number_value: "٠", display_order: (first?.display_order ?? 0) - 1 })
      .select("id")
      .single();
    if (error) {
      toast({ title: "خطأ", description: "تعذّرت الإضافة", variant: "destructive" });
      return;
    }
    setNewTitle("");
    setOpenId(data?.id || null);
    load();
  };

  const save = async (t: NumberStory) => {
    const { error } = await supabase
      .from("number_stories")
      .update({
        number_value: t.number_value,
        title: t.title,
        description: t.description || null,
        source: t.source || null,
        story_date: t.story_date || null,
        link_url: t.link_url || null,
        is_active: t.is_active,
      })
      .eq("id", t.id);
    if (error) {
      toast({ title: "خطأ", description: "تعذّر الحفظ", variant: "destructive" });
      return;
    }
    toast({ title: "تم الحفظ", description: "تم تحديث الرقم" });
    load();
  };

  const remove = async (t: NumberStory) => {
    if (!confirm(`حذف "${t.title}"؟`)) return;
    await supabase.from("number_stories").delete().eq("id", t.id);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الرقم</h1>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
            <Input className="flex-1 h-9" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان رقم جديد" />
            <Button type="submit" size="sm" className="gap-1"><Plus className="w-4 h-4" /> إضافة</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {items.map((t) => {
          const open = openId === t.id;
          return (
            <Card key={t.id} className="overflow-hidden">
              <CardHeader
                className="flex flex-row items-center justify-between gap-3 py-3 cursor-pointer"
                onClick={() => setOpenId(open ? null : t.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-primary shrink-0">{t.number_value}</span>
                  <CardTitle className="text-base truncate">{t.title}</CardTitle>
                  {!t.is_active && <span className="text-xs text-muted-foreground shrink-0">مخفي</span>}
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </CardHeader>

              {open && (
                <CardContent className="space-y-3 pb-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">الرقم</Label>
                      <Input className="h-9" value={t.number_value} onChange={(e) => patch(t.id, { number_value: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">العنوان</Label>
                      <Input className="h-9" value={t.title} onChange={(e) => patch(t.id, { title: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">النص التوضيحي</Label>
                    <Textarea rows={2} value={t.description} onChange={(e) => patch(t.id, { description: e.target.value })} />
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">المصدر</Label>
                      <Input className="h-9" value={t.source} onChange={(e) => patch(t.id, { source: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">التاريخ</Label>
                      <Input type="date" className="h-9" value={t.story_date} onChange={(e) => patch(t.id, { story_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">رابط (اختياري)</Label>
                      <Input dir="ltr" className="h-9" value={t.link_url} onChange={(e) => patch(t.id, { link_url: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={t.is_active} onCheckedChange={(v) => patch(t.id, { is_active: v })} />
                    <span className="text-sm">ظاهر في الموقع</span>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(t)}>حذف</Button>
                    <Button type="button" size="sm" onClick={() => save(t)}>حفظ</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ManageNumberStories;
