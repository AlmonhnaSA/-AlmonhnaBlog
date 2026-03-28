import { useEffect, useRef, useState } from "react";
import { useHighlights } from "@/hooks/useHighlights";
import { Highlighter, X, Heart } from "lucide-react";
import { toast } from "sonner";

interface TextHighlighterProps {
  contentId: string;
  contentType: "article" | "news";
  children: React.ReactNode;
}

export const TextHighlighter = ({ contentId, contentType, children }: TextHighlighterProps) => {
  const { highlights, addHighlight, removeHighlight } = useHighlights(contentId, contentType);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) {
        // Small delay to allow click on popup button
        setTimeout(() => {
          if (!document.querySelector("[data-highlight-popup]")) {
            setPopup(null);
          }
        }, 200);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) return;

      const text = selection.toString().trim();
      if (text.length < 5) return;

      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      setPopup({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 10,
        text,
      });
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleHighlight = () => {
    if (popup) {
      addHighlight(popup.text);
      toast.success("تم تضليل النص ❤️", { duration: 1500 });
      window.getSelection()?.removeAllRanges();
      setPopup(null);
    }
  };

  // Apply highlights to HTML content
  useEffect(() => {
    if (!containerRef.current || highlights.length === 0) return;

    const applyHighlights = () => {
      const walker = document.createTreeWalker(
        containerRef.current!,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Text[] = [];
      let node: Text | null;
      while ((node = walker.nextNode() as Text)) {
        textNodes.push(node);
      }

      // Remove existing highlight marks
      containerRef.current!.querySelectorAll("mark[data-highlight]").forEach((mark) => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
          parent.normalize();
        }
      });

      // Re-walk after cleanup
      const walker2 = document.createTreeWalker(
        containerRef.current!,
        NodeFilter.SHOW_TEXT,
        null
      );
      const freshNodes: Text[] = [];
      let node2: Text | null;
      while ((node2 = walker2.nextNode() as Text)) {
        freshNodes.push(node2);
      }

      highlights.forEach((highlight) => {
        freshNodes.forEach((textNode) => {
          const idx = textNode.textContent?.indexOf(highlight.text) ?? -1;
          if (idx === -1) return;

          const range = document.createRange();
          range.setStart(textNode, idx);
          range.setEnd(textNode, idx + highlight.text.length);

          const mark = document.createElement("mark");
          mark.setAttribute("data-highlight", highlight.id);
          mark.style.backgroundColor = "hsl(var(--primary) / 0.15)";
          mark.style.borderBottom = "2px solid hsl(var(--primary))";
          mark.style.padding = "1px 2px";
          mark.style.borderRadius = "2px";
          mark.style.cursor = "pointer";
          mark.title = "انقر لإزالة التضليل";

          mark.addEventListener("click", () => {
            removeHighlight(highlight.id);
            toast.success("تم إزالة التضليل", { duration: 1500 });
          });

          try {
            range.surroundContents(mark);
          } catch {
            // ignore if range crosses element boundaries
          }
        });
      });
    };

    // Small delay for DOM to be ready
    const timer = setTimeout(applyHighlights, 100);
    return () => clearTimeout(timer);
  }, [highlights, removeHighlight]);

  return (
    <div ref={containerRef} className="relative">
      {popup && (
        <div
          data-highlight-popup
          className="absolute z-50 flex items-center gap-1 bg-foreground text-background rounded-lg shadow-lg px-3 py-2 -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95"
          style={{ left: popup.x, top: popup.y }}
        >
          <button
            onClick={handleHighlight}
            className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <Heart className="w-4 h-4" />
            <span>إعجاب</span>
          </button>
        </div>
      )}
      {children}
    </div>
  );
};
