import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Plus, Trash2, CornerDownLeft } from "lucide-react";
import { makeAnchorKey } from "@/lib/articleExtras";

export interface KnowledgeLinkDraft {
  id?: string;
  anchor_key: string;
  question: string;
  target_article_id: string;
}

export interface ArticleExtrasValue {
  categoryIds: string[];
  sequencePoints: string[];
  knowledgeLinks: KnowledgeLinkDraft[];
  continuationIds: string[];
}

export const emptyExtras: ArticleExtrasValue = {
  categoryIds: [],
  sequencePoints: [],
  knowledgeLinks: [],
  continuationIds: [],
};

interface Props {
  value: ArticleExtrasValue;
  onChange: (value: ArticleExtrasValue) => void;
  currentArticleId?: string;
  /** Appends a knowledge-link marker into the article content HTML. */
  onInsertMarker?: (anchorKey: string, question: string) => void;
}

export const ArticleExtras = ({ value, onChange, currentArticleId, onInsertMarker }: Props) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: arts }] = await Promise.all([
        supabase.from("categories").select("id, name, slug, display_order").order("display_order"),
        supabase.from("articles").select("id, title").eq("status", "approved").order("created_at", { ascending: false }).limit(200),
      ]);
      setCategories(cats || []);
      setArticles((arts || []).filter((a: any) => a.id !== currentArticleId));
    })();
  }, [currentArticleId]);

  const set = (patch: Partial<ArticleExtrasValue>) => onChange({ ...value, ...patch });

  const toggleCategory = (id: string) => {
    set({
      categoryIds: value.categoryIds.includes(id)
        ? value.categoryIds.filter((c) => c !== id)
        : [...value.categoryIds, id],
    });
  };

  /* ---------------- sequence points ---------------- */
  const updatePoint = (index: number, text: string) => {
    const next = [...value.sequencePoints];
    next[index] = text;
    set({ sequencePoints: next });
  };

  const movePoint = (from: number, to: number) => {
    if (to < 0 || to >= value.sequencePoints.length) return;
    const next = [...value.sequencePoints];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set({ sequencePoints: next });
  };

  const availableContinuations = useMemo(
    () => articles.filter((a) => !value.continuationIds.includes(a.id)),
    [articles, value.continuationIds],
  );

  return (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <Label>التصنيفات (اختياري)</Label>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">لا توجد تصنيفات بعد.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map((cat) => {
              const active = value.categoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sequence points */}
      <div>
        <div className="flex items-center justify-between">
          <Label>تسلسل المقال (اختياري، 3 إلى 5 نقاط)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={value.sequencePoints.length >= 5}
            onClick={() => set({ sequencePoints: [...value.sequencePoints, ""] })}
          >
            <Plus className="w-4 h-4 ml-1" /> نقطة
          </Button>
        </div>
        <div className="space-y-2 mt-3">
          {value.sequencePoints.map((point, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) movePoint(dragIndex, i);
                setDragIndex(null);
              }}
              className="flex items-center gap-2"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
              <Input value={point} onChange={(e) => updatePoint(i, e.target.value)} placeholder={`المحطة ${i + 1}`} maxLength={80} />
              <Button type="button" variant="ghost" size="icon" onClick={() => set({ sequencePoints: value.sequencePoints.filter((_, x) => x !== i) })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {value.sequencePoints.length > 0 && value.sequencePoints.length < 3 && (
            <p className="text-xs text-muted-foreground">أضف 3 نقاط على الأقل حتى يظهر التسلسل للقارئ.</p>
          )}
        </div>
      </div>

      {/* Knowledge links */}
      {/* <div>
        <div className="flex items-center justify-between">
          <Label>وصلة معرفية (اختياري)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set({
                knowledgeLinks: [
                  ...value.knowledgeLinks,
                  { anchor_key: makeAnchorKey(), question: "", target_article_id: "" },
                ],
              })
            }
          >
            <Plus className="w-4 h-4 ml-1" /> وصلة
          </Button>
        </div> */}
        <div className="space-y-4 mt-3">
          {value.knowledgeLinks.map((link, i) => (
            <div key={link.anchor_key} className="rounded-xl border border-border p-4 space-y-3">
              <Textarea
                value={link.question}
                onChange={(e) => {
                  const next = [...value.knowledgeLinks];
                  next[i] = { ...link, question: e.target.value };
                  set({ knowledgeLinks: next });
                }}
                placeholder="السؤال الانتقالي، مثل: وماذا لو نظرنا للأمر من زاوية الأسرة؟"
                rows={2}
                maxLength={200}
              />
              <Select
                value={link.target_article_id || "none"}
                onValueChange={(v) => {
                  const next = [...value.knowledgeLinks];
                  next[i] = { ...link, target_article_id: v === "none" ? "" : v };
                  set({ knowledgeLinks: next });
                }}
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر المقال المرتبط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="text-right" value="none">بدون مقال</SelectItem>
                  {articles.map((a) => (
                    <SelectItem className="text-right" key={a.id} value={a.id}>{a.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 justify-between">
                {onInsertMarker && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => onInsertMarker(link.anchor_key, link.question)}>
                    <CornerDownLeft className="w-4 h-4 ml-1" /> أدرج مكانها في المحتوى
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => set({ knowledgeLinks: value.knowledgeLinks.filter((_, x) => x !== i) })}
                >
                  <Trash2 className="w-4 h-4 ml-1" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>

      {/* Continuations */}
      <div>
        <Label>الحكاية لم تنتهِ بعد (حتى 3 مقالات)</Label>
        <div className="space-y-2 mt-3">
          {value.continuationIds.map((cid, i) => (
            <div key={cid} className="flex items-center gap-2">
              <span className="flex-1 text-sm px-3 py-2 rounded-lg surface-alt truncate">
                {articles.find((a) => a.id === cid)?.title || "مقال"}
              </span>
              <Button type="button" variant="ghost" size="icon" onClick={() => set({ continuationIds: value.continuationIds.filter((x) => x !== cid) })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {value.continuationIds.length < 3 && (
            <Select value="none" onValueChange={(v) => v !== "none" && set({ continuationIds: [...value.continuationIds, v] })}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="أضف مقالًا يكمل الحكاية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-right" value="none">اختر مقالًا</SelectItem>
                {availableContinuations.map((a) => (
                  <SelectItem className="text-right" key={a.id} value={a.id}>{a.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};

/** Loads saved extras for an existing article. */
export const loadArticleExtras = async (articleId: string): Promise<ArticleExtrasValue> => {
  const [{ data: cats }, { data: links }, { data: conts }] = await Promise.all([
    supabase.from("article_categories").select("category_id").eq("article_id", articleId),
    supabase.from("article_knowledge_links").select("id, anchor_key, question, target_article_id").eq("article_id", articleId),
    supabase.from("article_continuations").select("target_article_id, display_order").eq("article_id", articleId).order("display_order"),
  ]);

  return {
    categoryIds: (cats || []).map((c: any) => c.category_id),
    sequencePoints: [],
    knowledgeLinks: (links || []).map((l: any) => ({
      id: l.id,
      anchor_key: l.anchor_key,
      question: l.question || "",
      target_article_id: l.target_article_id,
    })),
    continuationIds: (conts || []).map((c: any) => c.target_article_id),
  };
};

/** Replaces the saved relations for an article. */
export const saveArticleExtras = async (articleId: string, extras: ArticleExtrasValue) => {
  await Promise.all([
    supabase.from("article_categories").delete().eq("article_id", articleId),
    supabase.from("article_knowledge_links").delete().eq("article_id", articleId),
    supabase.from("article_continuations").delete().eq("article_id", articleId),
  ]);

  const tasks: Promise<any>[] = [];

  if (extras.categoryIds.length) {
    tasks.push(
      supabase.from("article_categories").insert(
        extras.categoryIds.map((category_id) => ({ article_id: articleId, category_id })) as any,
      ) as any,
    );
  }

  const links = extras.knowledgeLinks.filter((l) => l.target_article_id);
  if (links.length) {
    tasks.push(
      supabase.from("article_knowledge_links").insert(
        links.map((l) => ({
          article_id: articleId,
          target_article_id: l.target_article_id,
          question: l.question || null,
          anchor_key: l.anchor_key,
        })) as any,
      ) as any,
    );
  }

  if (extras.continuationIds.length) {
    tasks.push(
      supabase.from("article_continuations").insert(
        extras.continuationIds.slice(0, 3).map((target_article_id, i) => ({
          article_id: articleId,
          target_article_id,
          display_order: i,
        })) as any,
      ) as any,
    );
  }

  await Promise.all(tasks);
};

export default ArticleExtras;
