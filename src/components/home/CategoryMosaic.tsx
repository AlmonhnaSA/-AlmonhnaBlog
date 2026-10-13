import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/motion/Reveal";

interface Cell { id: string; name: string; slug: string; count: number; color: string; }
const placements = [[3, 5, 1, 3], [1, 3, 1, 2], [2, 3, 2, 4], [1, 2, 2, 3], [1, 2, 3, 4], [3, 5, 3, 4]];
const partial: Record<number, number[][]> = {
  1: [[1, 5, 1, 4]],
  2: [[3, 5, 1, 4], [1, 3, 1, 4]],
  3: [[3, 5, 1, 4], [1, 3, 1, 3], [1, 3, 3, 4]],
  4: [[3, 5, 1, 3], [1, 3, 1, 3], [3, 5, 3, 4], [1, 3, 3, 4]],
  5: [[3, 5, 1, 3], [1, 3, 1, 2], [2, 3, 2, 4], [1, 2, 2, 4], [3, 5, 3, 4]],
};
// Each 6-category block is a 4x3 composition of squares and rectangles; blocks tile side by side.
export const mosaicLayout = (total: number, perRow: number) => {
  const blocks = Math.max(1, Math.ceil(total / 6));
  const across = Math.min(perRow, blocks);
  const blockRows = Math.ceil(blocks / across);
  const place = (i: number) => {
    const group = Math.floor(i / 6);
    const rest = total - group * 6;
    const [c1, c2, r1, r2] = rest < 6 ? partial[rest][i % 6] : placements[i % 6];
    const blockRow = Math.floor(group / across);
    const inRow = blockRow === blockRows - 1 ? blocks - blockRow * across : across;
    const scale = across / inRow;
    const colStart = (group % across) * 4 * scale;
    return { gridColumn: `${colStart + (c1 - 1) * scale + 1} / ${colStart + (c2 - 1) * scale + 1}`, gridRow: `${blockRow * 3 + r1} / ${blockRow * 3 + r2}` };
  };
  return { columns: across * 4, rows: blockRows * 3, blockRows, place };
};
const shape = (i: number) => ["mosaic-xl", "mosaic-wide", "mosaic-tall", "mosaic-medium", "mosaic-small", "mosaic-fill"][i % 6];
const readableColor = (hex: string) => {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? "#173632" : "#ffffff";
};
export const CategoryMosaic = () => {
  const [active, setActive] = useState<string | null>(null);
  const [wide, setWide] = useState(() => typeof window === "undefined" || window.innerWidth >= 768);
  useEffect(() => { const mq = window.matchMedia("(min-width: 768px)"); const on = () => setWide(mq.matches); on(); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on); }, []);
  const { data: cells } = useQuery({ queryKey: ["category-mosaic"], queryFn: async (): Promise<Cell[]> => { const [{ data: categories, error: categoryError }, { data: links, error: linkError }] = await Promise.all([supabase.from("categories").select("id, name, slug, display_order, color").order("display_order"), supabase.from("article_categories").select("category_id, articles:article_id (status)")]); if (categoryError) throw categoryError; if (linkError) throw linkError; const counts = new Map<string, number>(); (links || []).forEach((row: any) => { if (row.articles?.status === "approved") counts.set(row.category_id, (counts.get(row.category_id) || 0) + 1); }); return (categories || []).map((item: any) => ({ ...item, color: item.color || "#3b6561", count: counts.get(item.id) || 0 })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count); } });
  if (!cells?.length) return null;
  const layout = mosaicLayout(cells.length, wide ? 2 : 1);
  
  return (
    <section className="mosaic-section">
<div className="container mx-auto px-6">
  <Reveal variant="side" className="section-heading-row">
    <div>
      <h2 className="editorial-heading editorial-heading-fit mt-2">
        مربع المُنحنى
      </h2>

      <h4 className="editorial-kicker">
        ما الذي يشغل المُنحنى ؟ قِس مساحة الكلمة التي تهمك
      </h4>
    </div>
  </Reveal>
     
      <div style={{ ["--mosaic-rows" as string]: layout.rows, ["--mosaic-cols" as string]: layout.columns, ["--mosaic-grow" as string]: 1 + (layout.blockRows - 1) * 0.45 }} className={`mosaic-layout p-5 ${active ? "has-active" : ""}`} onMouseLeave={() => setActive(null)}>
          {cells.map((cell, i) => <Reveal key={cell.id} delay={i * 55} variant="scale" style={layout.place(i)} className={`${shape(i)} mosaic-reveal`}><Link to={`/articles?category=${encodeURIComponent(cell.slug)}`} onMouseEnter={() => setActive(cell.id)} className={`mosaic-cell ${active === cell.id ? "is-active" : ""}`} style={{ backgroundColor: cell.color, color: readableColor(cell.color) }}><strong>{cell.name}</strong><span className="mosaic-count">{cell.count} مقال</span></Link></Reveal>)}
        </div>
      </div>
    </section>
  );
};
export default CategoryMosaic;
