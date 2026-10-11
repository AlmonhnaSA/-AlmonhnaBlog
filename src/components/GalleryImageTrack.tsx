import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";

interface GalleryImage {
  src: string;
  alt: string;
  href?: string;
}

interface Props {
  images: GalleryImage[];
  index: number;
  onSelect: (index: number) => void;
  naturalSize?: boolean;
}

export const GalleryImageTrack = ({ images, index, onSelect, naturalSize = false }: Props) => {
  const [viewportRef, api] = useEmblaCarousel({ direction: "rtl", loop: false, align: "start" });
  const [ratios, setRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!api) return;
    const select = () => onSelect(api.selectedScrollSnap());
    api.on("select", select);
    return () => { api.off("select", select); };
  }, [api, onSelect]);

  useEffect(() => { api?.scrollTo(index); }, [api, index]);

  return (
    <div ref={viewportRef} className={`gallery-swipe column-gallery-image ${naturalSize ? "gallery-swipe-natural" : ""}`}
      style={naturalSize ? { aspectRatio: ratios[images[index]?.src] || 1.95 } : undefined}>
      <div className="gallery-swipe-track">
        {images.map((image, slideIndex) => {
          const img = <img src={image.src} alt={image.alt} draggable={false} decoding="async" loading={slideIndex === index ? "eager" : "lazy"}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              if (naturalHeight) setRatios((current) => ({ ...current, [image.src]: naturalWidth / naturalHeight }));
            }} />;
          return image.href ? (
            <Link key={`${image.src}-${slideIndex}`} to={image.href} draggable={false} className="gallery-swipe-slide" tabIndex={slideIndex === index ? 0 : -1}>{img}</Link>
          ) : <div key={`${image.src}-${slideIndex}`} className="gallery-swipe-slide">{img}</div>;
        })}
      </div>
    </div>
  );
};