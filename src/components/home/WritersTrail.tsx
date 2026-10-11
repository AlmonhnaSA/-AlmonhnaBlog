import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Reveal } from "@/components/motion/Reveal";
import { ArrowLeft, Linkedin, User, X } from "lucide-react";
import EditorialCurve from "./EditorialCurve";

interface Topic { name: string; color: string; }
interface Writer { id: string; name: string; photo_url: string | null; bio: string | null; linkedin_url: string | null; twitter_url: string | null; articles: number; topics: Topic[]; }

const readableColor = (hex: string) => {
  const value = (hex || "").replace("#", "");
  if (value.length !== 6) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((o) => Number.parseInt(value.slice(o, o + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? "#173632" : "#ffffff";
};

export const WritersTrail = () => {
  const { ref, handlers } = useDragScroll<HTMLDivElement>();
  const navigate = useNavigate();
  const { data: writers } = useQuery({
    queryKey: ["writers-trail"],
    queryFn: async (): Promise<Writer[]> => {
      const [{ data: profiles, error: pErr }, { data: articles, error: aErr }, { data: links, error: lErr }] = await Promise.all([
        supabase.from("profiles").select("id, name, photo_url, bio, linkedin_url, twitter_url").eq("status", "approved"),
        supabase.from("articles").select("id, author_id").eq("status", "approved"),
        supabase.from("article_categories").select("article_id, categories:category_id (name, color)"),
      ]);
      if (pErr) throw pErr;
      if (aErr) throw aErr;
      if (lErr) throw lErr;
      const byAuthor = new Map<string, string[]>();
      (articles || []).forEach((article: any) => byAuthor.set(article.author_id, [...(byAuthor.get(article.author_id) || []), article.id]));
      const byArticle = new Map<string, Topic[]>();
      (links || []).forEach((link: any) => {
        if (link.categories?.name) byArticle.set(link.article_id, [...(byArticle.get(link.article_id) || []), { name: link.categories.name, color: link.categories.color || "#3b6561" }]);
      });
      return (profiles || [])
        .map((profile: any) => {
          const ids = byAuthor.get(profile.id) || [];
          const seen = new Set<string>();
          const topics: Topic[] = [];
          ids.flatMap((id) => byArticle.get(id) || []).forEach((topic) => {
            if (!seen.has(topic.name)) { seen.add(topic.name); topics.push(topic); }
          });
          return { ...profile, articles: ids.length, topics: topics.slice(0, 3) };
        })
        .filter((writer) => writer.articles > 0)
        .sort((a, b) => b.articles - a.articles);
    },
  });
  if (!writers?.length) return null;
  return (
    <section className="writers-section">
      <div className="container mx-auto px-6"><Reveal variant="side" className="section-heading-row">
        <div><p className="editorial-kicker">قنّينة الحِبر</p>
          <h2 className="editorial-heading mt-2">كُتّاب المُنحنى</h2></div>
        <Link to="/writers" className="editorial-link">كل الكُتّاب </Link></Reveal></div>
      <div className="writers-track-wrap"><EditorialCurve className="writers-curve" flip />
        <div ref={ref} {...handlers} dir="rtl" className="drag-scroll writers-track">
          {writers.slice(1).map((writer, i) => (
            <Reveal key={writer.id} delay={i * 75} variant="scale" className={`writer-point writer-point-${i % 4}`}>
              <div
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/writers/${writer.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(`/writers/${writer.id}`); }}
                className="group block cursor-pointer"
              >
                <div className="writer-portrait">{writer.photo_url ? <img src={writer.photo_url} alt={writer.name} draggable={false} /> : <User />}</div>
                <div className="writer-info">
                  <h3>{writer.name}</h3>
                  <p>{writer.bio}</p>
                  {writer.topics.length > 0 && (
                    <div className="writer-topics">
                      {writer.topics.map((topic) => (
                        <span key={topic.name} className="writer-topic" style={{ backgroundColor: topic.color, color: readableColor(topic.color) }}>{topic.name}</span>
                      ))}
                    </div>
                  )}
                  {(writer.linkedin_url || writer.twitter_url) && (
                    <div className="writer-socials">
                      {writer.twitter_url && (
                        <a href={writer.twitter_url} target="_blank" rel="noopener noreferrer" aria-label={`${writer.name} على X`} onClick={(e) => e.stopPropagation()}><X className="h-4 w-4" /></a>
                      )}
                      {writer.linkedin_url && (
                        <a href={writer.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label={`${writer.name} على لينكدإن`} onClick={(e) => e.stopPropagation()}><Linkedin className="h-4 w-4" /></a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
          <span className="w-[10vw] shrink-0" />
        </div>
      </div>
    </section>
  );
};
export default WritersTrail;
