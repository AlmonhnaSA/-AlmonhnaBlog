import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { ArticleCard } from "@/components/ArticleCard";
import { ShareButton } from "@/components/ShareDialog";
import { ColumnArticleGallery } from "@/components/ColumnArticleGallery";

const ProductDetail = () => {
  const { id } = useParams();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ["product-articles", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          profiles:author_id (name, photo_url)
        `)
        .eq("product_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">المنتج غير موجود</h1>
        </div>
      </div>
    );
  }

  const columnName = product.name.normalize("NFKC").replace(/[\u064B-\u065F\u0670\u0640]/g, "").trim();
  const isVisualColumn = columnName === "الصورة" || columnName === "مقتبس";

  return (
    <div className={`min-h-screen bg-background ${isVisualColumn ? "visual-column-page" : ""}`}>
      <TopBar />
      <Header />
      
      {isVisualColumn ? (
        <main className="visual-column-main">
         
<div className="visual-column-heading">
  <div className="w-full min-w-0">
    <h1>{product.name}</h1>
    {product.description && (
      <p className="w-full max-w-none text-right leading-8">
        {product.description}
      </p>
    )}
  </div>

  <ShareButton
    url={`https://almonhna.sa/products/${id}`}
    title={product.name}
    iconSize={20}
  />
</div>

          {articlesLoading ? <div className="column-gallery-loading bg-muted animate-pulse rounded-lg" /> : articles?.length ? (
            <ColumnArticleGallery articles={articles} isQuote={columnName === "مقتبس"} />
          ) : <p className="text-center text-muted-foreground py-12">لا توجد مقالات متعلقة بهذا المنتج</p>}
        </main>
      ) : <>
      <div className="container mx-auto px-8 py-8">
       <div className="surface-alt rounded-lg p-3 mb-3 shadow-md" style={{borderRadius:'20px'}}>
  <div className="flex flex-row md:flex-row items-start md:items-center gap-4 md:gap-8">
    {/* الصورة */}
    <img
      src={product.image_url}
      alt={product.name}
      className="w-24 h-24 md:w-32 md:h-32 object-cover " style={{borderRadius:'50px'}}
    />

    {/* النص */}
    <div className="flex-1 text-right w-full text-brand">
      <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">{product.name}</h1>
      {product.description && (
        <p className="text-sm md:text-lg ">{product.description}</p>
      )}
       </div>
    <ShareButton
      url={`https://almonhna.sa/products/${id}`}
      title={product.name}
      iconSize={20}
      className="mt-2 md:mt-0"
    />
  </div>
</div>

        </div>

        <h2 className="text-3xl font-bold mb-6 px-8 text-start pt-6">المقالات ذات الصلة</h2>
        
        {articles && articles.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 px-8">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                title={article.title}
                excerpt={article.excerpt}
                coverImage={article.cover_image_url}
                author={{
                  name: article.profiles.name,
                  photo: article.profiles.photo_url || undefined,
                }}
                date={article.created_at}
                type="article"
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">لا توجد مقالات متعلقة بهذا المنتج</p>
        )}
      </>}
      </div>
  );
};

export default ProductDetail;
