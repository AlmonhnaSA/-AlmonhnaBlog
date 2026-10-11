import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Reveal } from "@/components/motion/Reveal";
import { ArrowLeft, Quote } from "lucide-react";

export const QuestionsBecameContent = () => {
  const { ref, handlers } = useDragScroll<HTMLDivElement>();
  const { data: items } = useQuery({ queryKey: ["questions-became-content"], queryFn: async () => { const { data, error } = await supabase.from("audience_questions").select(`id, question, created_at, articles:linked_article_id (id, title, excerpt, cover_image_url, status)`).not("linked_article_id", "is", null).order("updated_at", { ascending: false }).limit(6); if (error) throw error; return (data || []).filter((row: any) => row.articles?.status === "approved"); } });
  if (!items?.length) return null;
  return (
    <section className="question-transform-section">
      <div className="container mx-auto px-6"><Reveal variant="side" className="section-heading-row"><div><p className="editorial-kicker">من السؤال إلى الحكاية</p><h2 className="editorial-heading mt-2">أسئلة أصبحت محتوى</h2></div><p className="section-hint">اسحب لمتابعة التحولات</p></Reveal></div>
      <div ref={ref} {...handlers} dir="rtl" className="drag-scroll question-transform-track">
        {items.map((item: any, i: number) => <Reveal key={item.id} delay={i * 80} variant="side" className="question-transform"><Link to={`/articles/${item.articles.id}`} draggable={false} className="group grid"><div className="question-origin"><Quote /><p>{item.question}</p></div><div className="question-curve"><svg viewBox="0 0 210 100" preserveAspectRatio="none"><path pathLength="1" d="M2 72 C55 10 130 98 208 26" /></svg><span>أصبح مقالًا</span></div><div className="question-result"><img src={item.articles.cover_image_url} alt={item.articles.title} draggable={false} loading="lazy" /><div><h3>{item.articles.title}</h3><ArrowLeft /></div></div></Link></Reveal>)}
        <span className="w-6 shrink-0" />
      </div>
    </section>
  );
};
export default QuestionsBecameContent;