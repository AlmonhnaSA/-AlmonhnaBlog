import { CSSProperties, ElementType, ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  once?: boolean;
  variant?: "rise" | "clip" | "scale" | "side";
  style?: CSSProperties;
}

/**
 * Light scroll-reveal wrapper. Uses IntersectionObserver only (no libraries),
 * and respects prefers-reduced-motion through the CSS layer.
 */
export const Reveal = ({ children, className, delay = 0, as, once = false, variant = "rise", style }: RevealProps) => {
  const Tag = (as || "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.08, rootMargin: "-6% 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref as any}
      className={cn("reveal", `reveal-${variant}`, visible && "is-visible", className)}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
