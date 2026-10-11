import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

export interface KnowledgeLinkData {
  id: string;
  anchor_key: string;
  question: string | null;
  target_article_id: string;
  target?: { id: string; title: string; status: string; cover_image_url: string | null } | null;
}

/** A real in-body passage to another idea. Dead links simply never render. */
export const KnowledgeLink = ({ link }: { link: KnowledgeLinkData }) => {
  if (!link.target || link.target.status !== "approved") return null;

  return (
    <Reveal className="my-8">
      <Link
        to={`/articles/${link.target.id}`}
        className="group block rounded-2xl border border-primary/50 bg-primary/5 p-5 md:p-6 transition-all duration-500 hover:bg-primary/10 hover:-translate-y-0.5"
      >
        <span className="inline-flex items-center gap-2 text-xs text-brand/70 mb-2">
          <Sparkles className="w-3.5 h-3.5" /> وصلة معرفية
        </span>
        {link.question && (
          <p className="text-lg md:text-xl leading-relaxed text-brand">{link.question}</p>
        )}
        <span className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-brand">
          {link.target.title}
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        </span>
      </Link>
    </Reveal>
  );
};

export default KnowledgeLink;
