import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Download, Lock, FileText, Eye } from "lucide-react";
import { Link } from "react-router-dom";
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
  const [userArticleCount, setUserArticleCount] = useState(0);
  const [isWriter, setIsWriter] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState({});
  const [restrictionDialog, setRestrictionDialog] = useState({
    open: false,
    message: "",
  });

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserChecked(true);
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasWriter = roles?.some(
        (r) => r.role === "writer" || r.role === "admin"
      ) ?? false;

      setIsWriter(hasWriter);

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

  const handleDownload = (e, fileUrl, fileName, requiredCount) => {
    e.preventDefault();
    e.stopPropagation();

    const canDownload = isWriter && userArticleCount >= requiredCount;

    if (!canDownload) {
      const msg = !isWriter
        ? `يجب أن تكون كاتباً ولديك على الأقل ${requiredCount} مقال منشور للتحميل`
        : `تحتاج ${requiredCount} مقال منشور (لديك حالياً ${userArticleCount})`;

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
                <div
                  key={i}
                  className="bg-muted animate-pulse rounded-xl h-48"
                />
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
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">المتجر</h1>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {products.map((product) => {
                const mainImg =
                  selectedImages[product.id] || product.image_url;

                const subImgs = product.store_product_images || [];
                const productFiles = product.store_product_files || [];

                const canDownload =
                  isWriter &&
                  userArticleCount >= product.required_articles_count;

                const isExpanded = expandedProduct === product.id;

                return (
                  <Link
                    key={product.id}
                    to={`/store/${product.id}`}
                  >
                    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                      
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={mainImg}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        {/* Thumbnails */}
                        {subImgs.length > 0 && (
                          <div className="flex gap-1 mb-3 flex-wrap">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedImages((prev) => ({
                                  ...prev,
                                  [product.id]: product.image_url,
                                }));
                              }}
                              className="w-8 h-8 border-2"
                            >
                              <img src={product.image_url} />
                            </button>

                            {subImgs.slice(0, 4).map((img) => (
                              <button
                                key={img.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedImages((prev) => ({
                                    ...prev,
                                    [product.id]: img.image_url,
                                  }));
                                }}
                                className="w-8 h-8 border-2"
                              >
                                <img src={img.image_url} />
                              </button>
                            ))}
                          </div>
                        )}

                        <h2 className="text-base font-bold">
                          {product.name}
                        </h2>

                        {product.description && (
                          <p className="text-xs line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        {/* Files */}
                        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                        <div className="mt-auto flex flex-wrap gap-2 pt-3">
                          {productFiles.map((file) => (
                            <Button
                              key={file.id}
                              size="sm"
                              disabled={!canDownload}
                              onClick={(e) =>
                                handleDownload(
                                  e,
                                  file.file_url,
                                  file.file_name,
                                  product.required_articles_count
                                )
                              }
                            >
                              <Download className="w-3 h-3 ml-1" />
                              {file.file_name}
                            </Button>
                          ))}
                        </div>

                        <div className="flex justify-between mt-3">
                       
<span className="flex items-center gap-1 text-xs text-muted-foreground">
  <FileText className="w-3 h-3" /> يتطلب {product.required_articles_count} مقالات
</span>
                         
                        </div>
                                                  </div>

                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center">لا توجد منتجات</p>
          )}
        </div>
      </main>

      {/* Dialog */}
      <Dialog
        open={restrictionDialog.open}
        onOpenChange={(open) =>
          setRestrictionDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>غير مصرح</DialogTitle>
          </DialogHeader>
          <p>{restrictionDialog.message}</p>
          <Button
            onClick={() =>
              setRestrictionDialog({ open: false, message: "" })
            }
          >
            حسناً
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Store;
