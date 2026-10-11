import { forwardRef } from "react";

export type QuoteSize = "square" | "story" | "wide";

export interface QuoteCardData {
  quote_text: string;
  writer_name: string;
  article_title?: string | null;
  x_handle?: string | null;
  linkedin_handle?: string | null;
  color: string;
  size: QuoteSize;
}

const sizeClass: Record<QuoteSize, string> = {
  square: "aspect-square",
  story: "aspect-[9/16]",
  wide: "aspect-[16/9]",
};

/** Visual quote card, also used as the DOM node exported to an image. */
export const QuoteCardPreview = forwardRef<HTMLDivElement, { data: QuoteCardData }>(
  ({ data }, ref) => {
    const size = (["square", "story", "wide"].includes(data.size) ? data.size : "square") as QuoteSize;

    return (
      <div
        ref={ref}
        dir="rtl"
        className={`relative w-full overflow-hidden rounded-2xl p-7 flex flex-col justify-between ${sizeClass[size]}`}
        style={{ backgroundColor: "#0f3833" }}
      >
        {/* header */}
        <div className="flex items-center justify-between">
          <span className="text-white/90 text-sm font-bold">المُنحنى</span>
          <span
            className="w-7 h-7 rounded-full"
            style={{ backgroundColor: data.color }}
          />
        </div>

        {/* quote */}
        <div className="flex-1 flex items-center">
          <div className="relative pr-4">
            <span
              className="absolute right-0 top-1 bottom-1 w-1 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <p className="text-white text-lg md:text-xl leading-relaxed font-bold whitespace-pre-wrap">
              {data.quote_text || "اكتب الاقتباس هنا…"}
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="space-y-1">
          <p className="text-white text-sm font-bold">{data.writer_name || "اسم الكاتب"}</p>
          {data.article_title && (
            <p className="text-white/60 text-[11px] leading-relaxed line-clamp-2">
              من: {data.article_title}
            </p>
          )}
          <div className="flex items-center gap-3 text-white/70 text-[11px]">
            {data.x_handle && <span>{data.x_handle.startsWith("@") ? data.x_handle : `@${data.x_handle}`}</span>}
            {data.linkedin_handle && <span>in/{data.linkedin_handle.replace(/^in\//, "")}</span>}
          </div>
        </div>

        <div
          className="pointer-events-none absolute -bottom-16 -left-16 w-52 h-52 rounded-full opacity-20"
          style={{ backgroundColor: data.color }}
        />
      </div>
    );
  }
);

QuoteCardPreview.displayName = "QuoteCardPreview";

export default QuoteCardPreview;
