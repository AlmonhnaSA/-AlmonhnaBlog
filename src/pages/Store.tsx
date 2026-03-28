import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Link } from "react-router-dom";

const Store = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_products")
        .select("*, store_product_images(*)")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <>
        <TopBar />
        <Header />
        <main className="min-h-screen py-12 px-4">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">المتجر</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-80" />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <Header />
      <main className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-primary">المتجر</h1>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Link key={product.id} to={`/store/${product.id}`} className="group">
                  <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5">
                      <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h2>
                      {product.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}
                      {/* Thumbnails of sub-images */}
                      {product.store_product_images && product.store_product_images.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {product.store_product_images.slice(0, 4).map((img: any, i: number) => (
                            <img
                              key={img.id || i}
                              src={img.image_url}
                              alt=""
                              className="w-10 h-10 rounded-md object-cover border border-border"
                            />
                          ))}
                          {product.store_product_images.length > 4 && (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                              +{product.store_product_images.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-xl">لا توجد منتجات في المتجر حالياً</p>
          )}
        </div>
      </main>
    </>
  );
};

export default Store;
