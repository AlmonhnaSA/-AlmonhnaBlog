import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { AudioUpload } from "@/components/AudioUpload";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Plus } from "lucide-react";

interface Episode {
  id: string;
  title: string;
  description: string;
  category: string;
  audio_url: string;
  cover_image_url: string;
  duration_label: string;
  episode_date: string;
  is_featured: boolean;
  is_active: boolean;
}

const ManageAudioEpisodes = () => {
  const [items, setItems] = useState<Episode[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("audio_episodes").select("*").order("display_order");
    setItems(
      (data || []).map((e: any) => ({
        id: e.id,
        title: e.title || "",
        description: e.description || "",
        category: e.category || "",
        audio_url: e.audio_url || "",
        cover_image_url: e.cover_image_url || "",
        duration_label: e.duration_label || "",
        episode_date: e.episode_date || "",
        is_featured: e.is_featured,
        is_active: e.is_active,
      })),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const patch = (id: string, p: Partial<Episode>) =>
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const { data: first } = await supabase
      .from("audio_episodes")
      .select("display_order")
      .order("display_order")
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from("audio_episodes")
      .insert({ title: newTitle.trim(), audio_url: "", display_order: (first?.display_order ?? 0) - 1 })
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

  const save = async (t: Episode) => {
    if (t.is_featured) {
      await supabase.from("audio_episodes").update({ is_featured: false }).neq("id", t.id);
    }
    const { error } = await supabase
      .from("audio_episodes")
      .update({
        title: t.title,
        description: t.description || null,
        category: t.category || null,
        audio_url: t.audio_url,
        cover_image_url: t.cover_image_url || null,
        duration_label: t.duration_label || null,
        episode_date: t.episode_date || null,
        is_featured: t.is_featured,
        is_active: t.is_active,
      })
      .eq("id", t.id);
    if (error) {
      toast({ title: "خطأ", description: "تعذّر الحفظ", variant: "destructive" });
      return;
    }
    toast({ title: "تم الحفظ", description: "تم تحديث الحلقة" });
    load();
  };

  const remove = async (t: Episode) => {
    if (!confirm(`حذف "${t.title}"؟`)) return;
    await supabase.from("audio_episodes").delete().eq("id", t.id);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">مسموع</h1>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
            <Input className="flex-1 h-9" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان حلقة جديدة" />
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
                  <CardTitle className="text-base truncate">{t.title}</CardTitle>
                  {t.is_featured && <span className="text-xs text-primary shrink-0">مميزة</span>}
                  {!t.is_active && <span className="text-xs text-muted-foreground shrink-0">مخفية</span>}
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </CardHeader>

              {open && (
                <CardContent className="space-y-3 pb-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">العنوان</Label>
                      <Input className="h-9" value={t.title} onChange={(e) => patch(t.id, { title: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">التصنيف</Label>
                      <Input className="h-9" value={t.category} onChange={(e) => patch(t.id, { category: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">الوصف</Label>
                    <Textarea rows={2} value={t.description} onChange={(e) => patch(t.id, { description: e.target.value })} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">المدة</Label>
                      <Input className="h-9" value={t.duration_label} onChange={(e) => patch(t.id, { duration_label: e.target.value })} placeholder="١٢:٤٥" />
                    </div>
                    <div>
                      <Label className="text-xs">التاريخ</Label>
                      <Input type="date" className="h-9" value={t.episode_date} onChange={(e) => patch(t.id, { episode_date: e.target.value })} />
                    </div>
                  </div>

                  <AudioUpload value={t.audio_url} onChange={(url) => patch(t.id, { audio_url: url })} />
                  <ImageUpload value={t.cover_image_url} onChange={(url) => patch(t.id, { cover_image_url: url })} label="صورة الحلقة" />

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={t.is_featured} onCheckedChange={(v) => patch(t.id, { is_featured: v })} />
                      <span className="text-sm">الحلقة المميزة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={t.is_active} onCheckedChange={(v) => patch(t.id, { is_active: v })} />
                      <span className="text-sm">ظاهرة في الموقع</span>
                    </div>
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

export default ManageAudioEpisodes;
