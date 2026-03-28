import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Download, Lock, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const StoreProductDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userArticleCount, setUserArticleCount] = useState<number>(0);
  const [isWriter, setIsWriter] = useState(false);
  const [loading, setLoading] = useState(true);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["store-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: subImages } = useQuery({
    queryKey: ["store-product-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_product_images")
        .select("*")
        .eq("store_product_id", id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: files } = useQuery({
    queryKey: ["store-product-files", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_product_files")
        .select("*")
        .eq("store_product_id", id);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    checkUserEligibility();
  }, []);

  const checkUserEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if writer
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasWriterRole = roles?.some(r => r.role === "writer" || r.role === "admin");
      setIsWriter(!!hasWriterRole);

      if (hasWriterRole) {
        // Get profile id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          // Count approved articles
          const { count } = await supabase
            .from("articles")
            .select("*", { count: "exact", head: true })
            .eq("author_id", profile.id)
            .eq("status", "approved");

          setUserArticleCount(count || 0);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const canDownload = isWriter && product && userArticleCount >= product.required_articles_count;

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (!canDownload) {
      toast({
        title: "غير مصرح بالتحميل",
        description: `يجب أن تكون كاتباً ولديك على الأقل ${product?.required_articles_count} مقال منشور لتتمكن من التحميل`,
        variant: "destructive",
      });
      return;
    }
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg" />
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

  const mainImage = selectedImage || product.image_url;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            </div>

            {/* Thumbnails */}
            {subImages && subImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedImage(null)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${!selectedImage ? "border-primary" : "border-border hover:border-primary/50"}`}
                >
                  <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                </button>
                {subImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img.image_url ? "border-primary" : "border-border hover:border-primary/50"}`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "#00343a" }}>{product.name}</h1>

            {product.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Files Section */}
            {files && files.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold">الملفات المرفقة</h3>

                {!loading && !canDownload && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        {!isWriter
                          ? "يجب أن تكون كاتباً لتتمكن من تحميل الملفات"
                          : `يجب أن يكون لديك على الأقل ${product.required_articles_count} مقال منشور لتتمكن من التحميل (لديك حالياً ${userArticleCount} مقال)`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-muted/50 rounded-xl p-4 border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(Number(file.file_size) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={canDownload ? "default" : "secondary"}
                        disabled={!canDownload}
                        onClick={() => handleDownload(file.file_url, file.file_name)}
                        className="shrink-0 mr-3"
                      >
                        <Download className="w-4 h-4 ml-2" />
                        تحميل
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProductDetail;
