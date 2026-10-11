import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Reveal from "@/components/motion/Reveal";
import { Eye, BookOpen, CalendarRange } from "lucide-react";

interface Props {
  writerId: string;
}

interface TopArticle {
  id: string;
  title: string;
  views: number | null;
  approved_at: string | null;
  created_at: string;
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "long" }) : "";

export const WriterKnowledgeProfile = ({ writerId }: Props) => {
  const [topics, setTopics] = useState<{ id: string; name: string; count: number }[]>([]);
  const [articles, setArticles] = useState<TopArticle[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: arts } = await supabase
        .from("articles")
        .select("id, title, views, approved_at, created_at")
        .eq("author_id", writerId)
        .eq("status", "approved");

      const list = (arts || []) as TopArticle[];
      if (cancelled) return;
      setArticles(list);

      if (!list.length) {
        setTopics([]);
        return;
      }

      const [{ data: links }, { data: cats }] = await Promise.all([
        supabase.from("article_categories").select("article_id, category_id").in("article_id", list.map((a) => a.id)),
        supabase.from("categories").select("id, name"),
      ]);

      if (cancelled) return;
      const counts: Record<string, number> = {};
      (links || []).forEach((l: any) => (counts[l.category_id] = (counts[l.category_id] || 0) + 1));
      setTopics(
        (cats || [])
          .filter((c: any) => counts[c.id])
          .map((c: any) => ({ id: c.id, name: c.name, count: counts[c.id] }))
          .sort((a, b) => b.count - a.count),
      );
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [writerId]);

  if (!articles.length) return null;

  const hasViews = articles.some((a) => (a.views || 0) > 0);
  const mostRead = hasViews
    ? [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3)
    : [];

  const dates = articles
    .map((a) => a.approved_at || a.created_at)
    .filter(Boolean)
    .sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  return (
    <Reveal>
      <section className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-brand mb-3">
            <BookOpen className="w-4 h-4" />
            <h2 className="font-bold">الموضوعات التي يكتب فيها</h2>
          </div>
          {topics.length ? (
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <Link
                  key={t.id}
                  to={`/articles?category=${t.id}`}
                  className="text-sm rounded-full border border-border px-3 py-1 hover:bg-muted transition-colors"
                >
                  {t.name} <span className="text-muted-foreground">({t.count})</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لم تُضف تصنيفات لمقالات هذا الكاتب بعد.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-brand mb-3">
            <Eye className="w-4 h-4" />
            <h2 className="font-bold">الأكثر قراءة</h2>
          </div>
          {mostRead.length ? (
            <ol className="space-y-2">
              {mostRead.map((a, i) => (
                <li key={a.id} className="text-sm leading-relaxed">
                  <Link to={`/articles/${a.id}`} className="hover:text-brand transition-colors">
                    <span className="text-muted-foreground ml-1">{i + 1}.</span>
                    {a.title}
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">لا تتوفر بيانات قراءة كافية بعد.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-brand mb-3">
            <CalendarRange className="w-4 h-4" />
            <h2 className="font-bold">رحلة الكاتب</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li>عدد المقالات المنشورة: <strong>{articles.length}</strong></li>
            {firstDate && <li>أول مقال: <strong>{formatDate(firstDate)}</strong></li>}
            {lastDate && <li>آخر مقال: <strong>{formatDate(lastDate)}</strong></li>}
          </ul>
        </div>
      </section>
    </Reveal>
  );
};

export default WriterKnowledgeProfile;
