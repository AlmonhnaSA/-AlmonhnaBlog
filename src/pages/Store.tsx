import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Download, Lock, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Store = () => {
  const [userArticleCount, setUserArticleCount] = useState<number>(0);
  const [isWriter, setIsWriter] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});
  const [restrictionDialog, setRestrictionDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const { data: products, isLoading } = useQuery({
    queryKey: ["store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_products")
        .select("*, store_product_images(*), store_product_files(*)")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUserChecked(true); return; }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasWriter = roles?.some(r => r.role === "writer" || r.role === "admin");
      setIsWriter(!!hasWriter);

      if (hasWriter) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          const { count } = await supabase
            .from("articles")
            .select("*", { count: "exact", head: true })
            .eq("author_id", profile.id)
            .eq("status", "approved");
          setUserArticleCount(count || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUserChecked(true);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string, requiredCount: number) => {
    const canDownload = isWriter && userArticleCount >= requiredCount;
    if (!canDownload) {
      const msg = !isWriter
        ? `يجب أن تكون كاتباً ولديك على الأقل ${requiredCount} مقال منشور للتحميل`
        : `تحتاج ${requiredCount} مقال منشور للتحميل (لديك حالياً ${userArticleCount} مقال)`;
      setRestrictionDialog({ open: true, message: msg });
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

  
  if (isLoading) {
    return (
      <>
        <TopBar />
        <Header />
        <main className="min-h-screen py-8 px-4">
          <div className="container">
            <h1 className="text-4xl font-bold mb-2">المتجر</h1>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
  {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-xl h-48" />
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
      <main className="min-h-screen py-8 px-4">
        <div className="container ">
          <h1 className="text-4xl font-bold mb-2">المتجر</h1>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const mainImg = selectedImages[product.id] || product.image_url;
                const subImgs = product.store_product_images || [];
                const productFiles = product.store_product_files || [];
                const canDownload = isWriter && userArticleCount >= product.required_articles_count;
                const isExpanded = expandedProduct === product.id;

                return (
                  <div
                    key={product.id}
                    className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Image section */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={mainImg}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content section */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Sub image thumbnails */}
                      {subImgs.length > 0 && (
                        <div className="flex gap-1 mb-3 flex-wrap">
                          <button
                            onClick={() => setSelectedImages(prev => ({ ...prev, [product.id]: product.image_url }))}
                            className={`w-8 h-8 rounded overflow-hidden border-2 transition-all ${mainImg === product.image_url ? "border-primary" : "border-border"}`}
                          >
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          </button>
                          {subImgs.slice(0, 4).map((img: any) => (
                            <button
                              key={img.id}
                              onClick={() => setSelectedImages(prev => ({ ...prev, [product.id]: img.image_url }))}
                              className={`w-8 h-8 rounded overflow-hidden border-2 transition-all ${mainImg === img.image_url ? "border-primary" : "border-border"}`}
                            >
                              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                          {subImgs.length > 4 && (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                              +{subImgs.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                      <h2 className="text-base font-bold mb-1 text-foreground">{product.name}</h2>
                      {product.description && (
                        <p className="text-muted-foreground text-xs line-clamp-2 mb-3">{product.description}</p>
                      )}

                     
                        {productFiles.length > 0 && (
                          <div className="flex items-center gap-1.5 mr-auto">
                            {!isExpanded && productFiles.length > 1 ? (
                              <>
                                <Button
                                  size="sm"
                                  variant={canDownload ? "default" : "secondary"}
                                  className="h-7 text-xs px-2"
                                  onClick={() => handleDownload(productFiles[0].file_url, productFiles[0].file_name, product.required_articles_count)}
                                >
                                  <Download className="w-3 h-3 ml-1" />
                                  تحميل الحزمة
                                </Button>
                                <button
                                  onClick={() => setExpandedProduct(product.id)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  +{productFiles.length - 1}
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {productFiles.map((file: any) => (
                                  <Button
                                    key={file.id}
                                    size="sm"
                                    variant={canDownload ? "default" : "secondary"}
                                    className="h-7 text-xs px-2"
                                    onClick={() => handleDownload(file.file_url, file.file_name, product.required_articles_count)}
                                  >
                                    <Download className="w-3 h-3 ml-1" />
                                    {file.file_name}
                                  </Button>
                                ))}
                                {isExpanded && productFiles.length > 1 && (
                                  <button
                                    onClick={() => setExpandedProduct(null)}
                                    className="text-xs text-muted-foreground hover:underline"
                                  >
                                    إخفاء
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                       {/* Files & requirement row */}
                      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                        {product.required_articles_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            يتطلب {product.required_articles_count} مقالات
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-lg">لا توجد منتجات في المتجر حالياً</p>
          )}
        </div>
      </main>

      <Dialog open={restrictionDialog.open} onOpenChange={(open) => setRestrictionDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-destructive">
              <Lock className="w-5 h-5" />
              غير مصرح بالتحميل
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{restrictionDialog.message}</p>
          <Button variant="outline" size="sm" onClick={() => setRestrictionDialog({ open: false, message: "" })}>
            حسناً
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Store;
