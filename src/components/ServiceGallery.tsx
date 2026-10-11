import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { ShareButton } from "@/components/ShareDialog";
import { Button } from "@/components/ui/button";
import { GalleryImageTrack } from "@/components/GalleryImageTrack";

interface Props {
  images: string[];
  title?: string | null;
  subtitle?: string;
  pdfUrl?: string | null;
  shareUrl: string;
  displayUrl: string;
}

export const ServiceGallery = ({ images, title, subtitle, pdfUrl, shareUrl, displayUrl }: Props) => {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const activeIndex = Math.min(index, Math.max(0, total - 1));
  const go = useCallback((step: number) => {
    setIndex((current) => Math.max(0, Math.min(total - 1, current + step)));
  }, [total]);

  useEffect(() => { setIndex(0); }, [images]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.matches("input, textarea, select") || event.target.isContentEditable)) return;
      if (event.key === "ArrowLeft") go(1);
      if (event.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!total) return null;

  return (
    <section className="column-gallery" dir="rtl" aria-label={title || "معرض صور الخدمة"}>
      <div className="visual-column-heading2">
       <div className="min-w-0"></div> 

        {/* <div className="min-w-0">{title && <h1>{title}</h1>}{subtitle && <p>{subtitle}</p>}</div> */}
        <div className="flex shrink-0 items-center gap-2">
          <ShareButton url={shareUrl} displayUrl={displayUrl} title={title || ""} iconSize={20} />
          {pdfUrl && (
            <Button asChild variant="outline" size="icon">
              <a href={pdfUrl} target="_blank" rel="noreferrer" download aria-label="تحميل PDF" title="تحميل PDF">
                <Download className="h-5 w-5" />
              </a>
            </Button>
          )}
        </div>
      </div>
      <div className="column-gallery-stage">
        <GalleryImageTrack images={images.map((src, imageIndex) => ({ src, alt: `صفحة ${imageIndex + 1}` }))} index={activeIndex} onSelect={setIndex} naturalSize />
        {total > 1 && <>
          <Button variant="outline" size="icon" className="column-gallery-arrow column-gallery-arrow-prev" aria-label="السابق" title="السابق" disabled={activeIndex === 0} onClick={() => go(-1)}><ChevronRight className="h-5 w-5" /></Button>
          <Button variant="outline" size="icon" className="column-gallery-arrow column-gallery-arrow-next" aria-label="التالي" title="التالي" disabled={activeIndex === total - 1} onClick={() => go(1)}><ChevronLeft className="h-5 w-5" /></Button>
        </>}
      </div>
      <p className="text-sm text-muted-foreground text-center my-4" aria-live="polite">الصفحة {activeIndex + 1} من {total}</p>
      {total > 1 && (
        <div className="column-gallery-thumbnails">
          {images.map((image, imageIndex) => (
            <Button key={`${image}-${imageIndex}`} variant="ghost" className="column-gallery-thumbnail" aria-label={`صفحة ${imageIndex + 1}`} title={`صفحة ${imageIndex + 1}`} aria-pressed={imageIndex === activeIndex} onClick={() => setIndex(imageIndex)}>
              <img src={image} alt={`صفحة ${imageIndex + 1}`} loading="lazy" decoding="async" />
            </Button>
          ))}
        </div>
      )}
    </section>
  );
};

export default ServiceGallery;
