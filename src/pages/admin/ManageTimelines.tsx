import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";

interface Stop {
  id?: string;
  title: string;
  label: string;
  image_url?: string;
  description?: string;
  article_id?: string;
}

interface Timeline {
  id: string;
  title: string;
  description: string;
  timeline_type: string;
  image_url: string;
  color: string;
  is_active: boolean;
  stops: Stop[];
}

const COLORS = ["#00343A", "#3b6561", "#47716d", "#e1a437", "#b4532a", "#5b4b8a"];

const ManageTimelines = () => {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    const [{ data: lines }, { data: stops }] = await Promise.all([
      supabase.from("timelines").select("*").order("display_order"),
      supabase.from("timeline_stops").select("*").order("display_order"),
    ]);
    setTimelines(
      (lines || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description || "",
        timeline_type: l.timeline_type || "interactive",
        image_url: l.image_url || "",
        color: l.color || "#00343A",
        is_active: l.is_active,
        stops: (stops || [])
          .filter((s: any) => s.timeline_id === l.id)
          .map((s: any) => ({
            id: s.id,
            title: s.title,
            label: s.label || "",
            image_url: s.image_url || "",
            description: s.description || "",
            article_id: s.article_id || "",
          })),
      })),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const patch = (id: string, p: Partial<Timeline>) =>
    setTimelines((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const addTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const { data: first } = await supabase.from("timelines").select("display_order").order("display_order").limit(1).maybeSingle();
    const { data, error } = await supabase
      .from("timelines")
      .insert({ title: newTitle.trim(), display_order: (first?.display_order ?? 0) - 1 })
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

  const save = async (t: Timeline) => {
    const { error } = await supabase
      .from("timelines")
      .update({
        title: t.title,
        timeline_type: t.timeline_type,
        image_url: t.image_url || null,
        color: t.color,
        is_active: t.is_active,
      })
      .eq("id", t.id);

    if (error) {
      toast({ title: "خطأ", description: "تعذّر الحفظ", variant: "destructive" });
      return;
    }

    await supabase.from("timeline_stops").delete().eq("timeline_id", t.id);
    const rows = t.stops
      .filter((s) => s.title.trim())
      .map((s, i) => ({
        timeline_id: t.id,
        title: s.title,
        label: s.label || null,
        description: s.description || null,
        image_url: s.image_url || null,
        article_id: s.article_id || null,
        display_order: i,
      }));
    if (rows.length) await supabase.from("timeline_stops").insert(rows);

    toast({ title: "تم الحفظ", description: "تم تحديث الخط الزمني" });
    load();
  };

  const remove = async (t: Timeline) => {
    if (!confirm(`حذف الخط "${t.title}"؟`)) return;
    await supabase.from("timelines").delete().eq("id", t.id);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">خطوط المُنحنى</h1>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={addTimeline} className="flex flex-col sm:flex-row gap-2">
            <Input className="flex-1 h-9" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان خط جديد" />
            <Button type="submit" size="sm" className="gap-1"><Plus className="w-4 h-4" /> إضافة</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {timelines.map((t) => {
          const open = openId === t.id;
          return (
            <Card key={t.id} className="overflow-hidden">
              <CardHeader
                className="flex flex-row items-center justify-between gap-3 py-3 cursor-pointer"
                onClick={() => setOpenId(open ? null : t.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0 border" style={{ background: t.color }} />
                  <CardTitle className="text-base truncate">{t.title}</CardTitle>
                  <span className="text-xs text-muted-foreground shrink-0">{t.stops.length} محطة</span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </CardHeader>

              {open && (
                <CardContent className="space-y-3 pb-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">العنوان</Label>
                      <Input className="h-9" value={t.title} onChange={(e) => patch(t.id, { title: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">نوع العرض</Label>
                      <Select dir="rtl" value={t.timeline_type} onValueChange={(v) => patch(t.id, { timeline_type: v })}>
                        <SelectTrigger className="h-9 text-right"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem className="text-right" value="interactive">خط تفاعلي</SelectItem>
                          <SelectItem className="text-right" value="image">صورة مصمّمة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">اللون</Label>
                      <div className="flex items-center gap-2 h-9">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => patch(t.id, { color: c })}
                            className={`w-6 h-6 rounded-full border-2 ${t.color === c ? "border-foreground" : "border-transparent"}`}
                            style={{ background: c }}
                            aria-label={c}
                          />
                        ))}
                        <input
                          type="color"
                          value={t.color}
                          onChange={(e) => patch(t.id, { color: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border"
                        />
                      </div>
                    </div>
                  </div>

                  {t.timeline_type === "image" && (
                    <ImageUpload value={t.image_url} onChange={(url) => patch(t.id, { image_url: url })} label="صورة الخط الزمني" />
                  )}

                  <div className="flex items-center gap-2">
                    <Switch checked={t.is_active} onCheckedChange={(v) => patch(t.id, { is_active: v })} />
                    <span className="text-sm">ظاهر في الموقع</span>
                  </div>

                  {t.timeline_type === "interactive" && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">المحطات</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => patch(t.id, { stops: [{ title: "", label: "" }, ...t.stops] })}
                        >
                          <Plus className="w-4 h-4 ml-1" /> محطة
                        </Button>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {t.stops.map((stop, i) => (
                          <div
                            key={i}
                            draggable
                            onDragStart={() => setDragKey(`${t.id}:${i}`)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (!dragKey?.startsWith(`${t.id}:`)) return;
                              const from = Number(dragKey.split(":")[1]);
                              const stops = [...t.stops];
                              const [item] = stops.splice(from, 1);
                              stops.splice(i, 0, item);
                              patch(t.id, { stops });
                              setDragKey(null);
                            }}
                            className="flex items-center gap-2"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                            <Input
                              className="h-9 flex-1"
                              value={stop.title}
                              onChange={(e) => patch(t.id, { stops: t.stops.map((s, x) => (x === i ? { ...s, title: e.target.value } : s)) })}
                              placeholder="العنوان"
                            />
                            <Input
                              className="h-9 w-36"
                              value={stop.label}
                              onChange={(e) => patch(t.id, { stops: t.stops.map((s, x) => (x === i ? { ...s, label: e.target.value } : s)) })}
                              placeholder="التاريخ"
                            />
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => patch(t.id, { stops: t.stops.filter((_, x) => x !== i) })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

export default ManageTimelines;
