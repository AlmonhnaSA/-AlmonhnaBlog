import { Link } from "react-router-dom";
import { Reveal } from "@/components/motion/Reveal";
import { ArrowLeft } from "lucide-react";

export interface ContinuationItem {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
}

export const StoryContinues = ({ items }: { items: ContinuationItem[] }) => {
  if (!items.length) return null;

  return (
    <section className="container mx-auto px-4 pb-12 max-w-4xl">
      <Reveal>
        <h2 className="text-2xl md:text-3xl text-brand mb-6">الحكاية لم تنتهِ بعد</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {items.slice(0, 3).map((item, i) => (
            <Reveal key={item.id} delay={i * 80}>
              <Link
                to={`/articles/${item.id}`}
                className="group h-full flex flex-col rounded-2xl overflow-hidden surface-alt border border-border/60 transition-all duration-500 hover:border-primary hover:-translate-y-1"
              >
                <div className="overflow-hidden zoom-media h-36">
                  <img src={item.cover_image_url} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg leading-snug line-clamp-2 text-brand">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{item.excerpt}</p>
                  <span className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-brand">
                    تابع <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </section>
  );
};

export default StoryContinues;
