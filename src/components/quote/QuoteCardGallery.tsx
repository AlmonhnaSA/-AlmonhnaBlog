import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Trash2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import QuoteCardPreview, { QuoteCardData } from "@/components/quote/QuoteCardPreview";

export interface GalleryQuoteCard extends QuoteCardData {
  id: string;
  created_at?: string;
  background_color?: string | null;
}

const sizeLabel: Record<string, string> = { square: "مربع", story: "ستوري", wide: "عريض" };
// Dialog width derives from the card ratio so card + title + buttons always fit in 92vh — no scrolling.
const modalWidth: Record<string, string> = {
  square: "w-[min(92vw,calc(92vh-10rem))]",
  story: "w-[min(92vw,calc((92vh-10rem)*9/16))]",
  wide: "w-[min(92vw,calc((92vh-10rem)*16/9))]",
};

interface Props {
  cards: GalleryQuoteCard[];
  onDelete: (id: string) => void;
  showWriter?: boolean;
}

/** Simple list of saved quote cards; clicking one opens the designed card in a modal. */
export const QuoteCardGallery = ({ cards, onDelete, showWriter }: Props) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const open = cards.find((c) => c.id === openId) || null;

  const download = async () => {
    if (!ref.current) return;
    const url = await toPng(ref.current, { pixelRatio: 3, cacheBust: true });
    const a = document.createElement("a");
    a.href = url;
    a.download = `quote-${open?.id}.png`;
    a.click();
  };

  return (
    <>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {cards.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setOpenId(c.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/50"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border"
                style={{ backgroundColor: c.background_color || c.color }}
                aria-hidden="true"
              >
                <Quote className="h-4 w-4" style={{ color: c.color }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{c.quote_text}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {showWriter ? `${c.writer_name} · ` : ""}
                  {sizeLabel[c.size] || "مربع"}
                  {c.created_at ? ` · ${new Date(c.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-xs text-primary">عرض</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent dir="rtl" className={`${open ? modalWidth[open.size] || modalWidth.square : modalWidth.square} gap-4 p-5 [&>button]:left-4 [&>button]:right-auto`}>
          <DialogTitle className="pl-8 text-right text-base">بطاقة الاقتباس</DialogTitle>
          <DialogDescription className="sr-only">معاينة البطاقة بتصميمها المختار</DialogDescription>
          {open && (
            <>
              <div className="mx-auto w-full"><QuoteCardPreview ref={ref} data={open} /></div>
              <div className="relative z-10 flex items-center justify-between gap-2 border-t border-border pt-3">
                <Button size="sm" onClick={download}><Download className="ml-1 h-4 w-4" /> تنزيل</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => { onDelete(open.id); setOpenId(null); }}
                >
                  <Trash2 className="ml-1 h-4 w-4" /> حذف
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuoteCardGallery;
