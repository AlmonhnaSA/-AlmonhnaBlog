import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Link } from "react-router-dom";



const Products = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
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
            <h1 className="text-4xl font-bold mb-8 text-center">الأعمدة  </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-64" />
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
          <h1 className="text-4xl font-bold mb-8 text-center text-primary">الأعمدة   </h1>

          
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group"
                >
                  <div  className="bg-card overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="aspect-square overflow-hidden" >
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h2>
                      {product.description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-xl">لا توجد أعمدة  متاحة حالياً</p>
          )}
        </div>
      </main>
    </>
  );
};

export default Products;
