import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Copy, Trash2, Save } from "lucide-react";
import { toPng } from "html-to-image";
import QuoteCardPreview, { QuoteCardData, QuoteSize } from "@/components/quote/QuoteCardPreview";

const COLORS = ["#3b9d90", "#0f3833", "#e1a437", "#4b7f2f", "#2a514e", "#a33b2a"];
const SIZES: { value: QuoteSize; label: string }[] = [
  { value: "wide", label: "عريض" },
  { value: "story", label: "قصة" },
  { value: "square", label: "مربع" },
];

const MAX_CHARS = 160;

interface SavedCard extends QuoteCardData {
  id: string;
  created_at: string;
}

const WriterQuoteCards = () => {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [profileId, setProfileId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [articles, setArticles] = useState<{ id: string; title: string }[]>([]);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    quote_text: "",
    article_id: "",
    writer_name: "",
    x_handle: "",
    linkedin_handle: "",
    color: COLORS[1],
    size: "square" as QuoteSize,
  });

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, twitter_url, linkedin_url")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setProfileId(profile.id);
      setForm((p) => ({
        ...p,
        writer_name: p.writer_name || profile.name || "",
        x_handle: p.x_handle || (profile.twitter_url || "").split("/").filter(Boolean).pop() || "",
        linkedin_handle: p.linkedin_handle || (profile.linkedin_url || "").split("/").filter(Boolean).pop() || "",
      }));

      const { data: arts } = await supabase
        .from("articles")
        .select("id, title")
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false });
      setArticles(arts || []);
    }

    const { data: saved } = await supabase
      .from("quote_cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setCards((saved as any[])?.map((c) => ({ ...c, size: c.size as QuoteSize })) || []);
  };

  const previewData: QuoteCardData = {
    quote_text: form.quote_text,
    writer_name: form.writer_name,
    article_title: articles.find((a) => a.id === form.article_id)?.title || null,
    x_handle: form.x_handle,
    linkedin_handle: form.linkedin_handle,
    color: form.color,
    size: form.size,
  };

  const handleSave = async () => {
    if (!form.quote_text.trim() || !form.writer_name.trim()) {
      toast({ title: "خطأ", description: "الاقتباس واسم الكاتب مطلوبان", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("quote_cards").insert({
      user_id: userId,
      profile_id: profileId,
      quote_text: form.quote_text.trim(),
      article_id: form.article_id || null,
      article_title: previewData.article_title,
      writer_name: form.writer_name.trim(),
      x_handle: form.x_handle || null,
      linkedin_handle: form.linkedin_handle || null,
      color: form.color,
      size: form.size,
    });
    setSaving(false);

    if (error) {
      toast({ title: "خطأ", description: "تعذر حفظ البطاقة", variant: "destructive" });
      return;
    }
    toast({ title: "تم الحفظ", description: "أُضيفت بطاقة الاقتباس" });
    void load();
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.download = "almonhna-quote.png";
      link.href = dataUrl;
      link.click();
    } catch {
      toast({ title: "خطأ", description: "تعذر إنشاء الصورة", variant: "destructive" });
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(
      `"${form.quote_text}"\n— ${form.writer_name} | المُنحنى`
    );
    toast({ title: "تم النسخ", description: "نُسخ نص الاقتباس" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("quote_cards").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "تعذر الحذف", variant: "destructive" });
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">بطاقة اقتباس</h1>
        <p className="text-muted-foreground">الصق جملة من كتاباتك، وخذها صورة جاهزة للنشر بهوية المُنحنى.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الصق الاقتباس</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* form */}
            <div className="space-y-4">
              <div>
                <Textarea
                  value={form.quote_text}
                  onChange={(e) => setForm({ ...form, quote_text: e.target.value.slice(0, MAX_CHARS) })}
                  placeholder="المال مهم، لكن ما يسبق المال هو العلاقات."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.quote_text.length} / {MAX_CHARS} حرفًا
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>المقال</Label>
                  <Select
                    value={form.article_id || "none"}
                    onValueChange={(v) => setForm({ ...form, article_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger className="text-right"><SelectValue placeholder="اختر مقالًا" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem className="text-right" value="none">بدون مقال</SelectItem>
                      {articles.map((a) => (
                        <SelectItem className="text-right" key={a.id} value={a.id}>{a.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الكاتب</Label>
                  <Input value={form.writer_name} onChange={(e) => setForm({ ...form, writer_name: e.target.value })} />
                </div>
                <div>
                  <Label>لينكدإن</Label>
                  <Input
                    value={form.linkedin_handle}
                    onChange={(e) => setForm({ ...form, linkedin_handle: e.target.value })}
                    placeholder="in/username"
                  />
                </div>
                <div>
                  <Label>حساب إكس</Label>
                  <Input
                    value={form.x_handle}
                    onChange={(e) => setForm({ ...form, x_handle: e.target.value })}
                    placeholder="@username"
                  />
                </div>
              </div>

              <div>
                <Label>لون العمود</Label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        form.color === c ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>المقاس</Label>
                <div className="flex gap-2 mt-2">
                  {SIZES.map((s) => (
                    <Button
                      key={s.value}
                      type="button"
                      size="sm"
                      variant={form.size === s.value ? "default" : "outline"}
                      onClick={() => setForm({ ...form, size: s.value })}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 ml-2" /> نزّل الصورة
                </Button>
                <Button variant="outline" onClick={handleCopyText}>
                  <Copy className="w-4 h-4 ml-2" /> انسخ
                </Button>
                <Button variant="secondary" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 ml-2" /> {saving ? "جاري الحفظ..." : "حفظ البطاقة"}
                </Button>
              </div>
            </div>

            {/* preview */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">معاينة</p>
              <div className="max-w-sm">
                <QuoteCardPreview ref={cardRef} data={previewData} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بطاقاتي المحفوظة ({cards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد بطاقات محفوظة بعد.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <div key={c.id} className="space-y-2">
                  <QuoteCardPreview data={c} />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-4 h-4 ml-1" /> حذف
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WriterQuoteCards;
