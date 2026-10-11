import { useEffect, useState } from "react";

interface ArticleSequenceProps {
  points: string[];
  contentRef: React.RefObject<HTMLElement>;
}

/**
 * Interactive reading map. Clicking a stop scrolls to the matching section
 * of the article when one exists; otherwise it just marks the reader's place.
 */
export const ArticleSequence = ({ points, contentRef }: ArticleSequenceProps) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const headings = Array.from(el.querySelectorAll("h1, h2, h3"));
    headings.forEach((h, i) => {
      if (!h.id) h.id = `sequence-stop-${i}`;
    });
  }, [contentRef, points.length]);

  if (!points.length) return null;

  const goTo = (index: number) => {
    setActive(index);
    const el = contentRef.current;
    const headings = el ? Array.from(el.querySelectorAll("h1, h2, h3")) : [];
    const target = headings[index];
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <nav aria-label="تسلسل المقال" className="my-8 rounded-2xl surface-alt p-5 md:p-6">
      <p className="text-sm text-muted-foreground mb-5">تسلسل المقال</p>
      <ol className="relative flex flex-col md:flex-row md:items-start gap-5 md:gap-0">
        <span className="hidden md:block absolute top-[9px] right-2 left-2 h-px bg-primary/40" aria-hidden="true" />
        {points.map((point, i) => (
          <li key={i} className="relative md:flex-1 md:px-3 flex md:block items-start gap-3">
            <button
              type="button"
              onClick={() => goTo(i)}
              className="text-right w-full group"
            >
              <span
                className={`block w-[18px] h-[18px] rounded-full border-2 border-primary transition-all duration-300 shrink-0 ${
                  i <= active ? "bg-primary" : "bg-background"
                } group-hover:scale-110`}
              />
              <span className={`block md:mt-3 text-sm leading-relaxed transition-colors ${i === active ? "text-brand font-semibold" : "text-muted-foreground"}`}>
                {point}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default ArticleSequence;
