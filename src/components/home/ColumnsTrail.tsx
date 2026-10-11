import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Reveal } from "@/components/motion/Reveal";
import EditorialCurve from "./EditorialCurve";

export const ColumnsTrail = () => {
  const { ref, handlers } = useDragScroll<HTMLDivElement>();
  const { data: products, isLoading } = useQuery({ queryKey: ["products"], queryFn: async () => { const { data, error } = await supabase.from("products").select("*").order("display_order", { ascending: true }); if (error) throw error; return data; } });
  if (isLoading) return <section className="journey-section"><div className="container mx-auto px-6"><div className="h-72 animate-pulse bg-muted/40" /></div></section>;
  if (!products?.length) return null;
  return (
    <section id="products-section" className="journey-section">
      <div className="container mx-auto px-6"><Reveal variant="side" className="section-heading-row"><div><h2 className="editorial-heading mt-2">الأعمدة</h2></div></Reveal></div>
      <div className="journey-track-wrap">
        {/* <EditorialCurve className="journey-curve" /> */}
        <div ref={ref} {...handlers} dir="rtl" className="drag-scroll journey-track">
          {products.map((product: any, i: number) => (
            <Reveal key={product.id} delay={i * 70} variant="scale" className={`journey-node journey-node-${i % 4}`}>
              <Link to={`/products/${product.id}`} draggable={false} className="journey-card group">
                <span className="journey-stem" aria-hidden="true"><i /></span>
                <div className="journey-image"><img src={product.image_url} alt={product.name} loading="lazy" draggable={false} /></div>
                {/* <span className="journey-label">{product.name}</span> */}
              </Link>
            </Reveal>
          ))}
          <span className="w-[8vw] shrink-0" />
        </div>
      </div>
    </section>
  );
};
export default ColumnsTrail;
