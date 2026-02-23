import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const ProductsSlider = () => {
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
      <div className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">الأعمدة  </h2>
          <div className="flex gap-4 justify-center">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-48 h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 px-4" >
      <div className="container " style={{paddingRight:'1rem'}}>
        <h2 className="text-3xl font-bold mb-8 text-start" style={{color :'#00343a'}}>الأعمدة  </h2>
        
        <div className="relative ">
          <Carousel
            opts={{
              align: "start",
              direction: "rtl",
            }}
            className="w-full"
          >
            
            <CarouselContent className=" ml-2 mr-2">
              {products.map((product) => (
                <CarouselItem key={product.id} className="pr-4 pl-0 basis-1/2 md:basis-1/3 lg:basis-1/6">
                  <Link to={`/products/${product.id}`}>
                    <div style={{borderRadius:'70px !important'}} className="bg-card1  hover:shadow-lg transition-shadow cursor-pointer">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            {products.length > 6 && (
  <>
             <CarouselNext className="-left-12 right-auto" />
          <CarouselPrevious className="-right-12 left-auto" />
    </>
)}
          </Carousel>
          
         
        </div>
      </div>
    </section>
  );
};

export default ProductsSlider;
