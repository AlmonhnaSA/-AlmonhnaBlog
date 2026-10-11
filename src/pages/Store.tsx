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

const remainingLabel = (n: number) => {
  if (n === 1) return "يتبقّى مقال واحد";
  if (n === 2) return "يتبقّى مقالان";
  if (n <= 10) return `يتبقّى ${n} مقالات`;
  return `يتبقّى ${n} مقالاً`;
};

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

          {userChecked && isWriter && products && products.length > 0 && (() => {
            const next = [...products]
              .filter((p) => p.required_articles_count > userArticleCount)
              .sort((a, b) => a.required_articles_count - b.required_articles_count)[0];
            const max = Math.max(...products.map((p) => p.required_articles_count || 0), userArticleCount, 1);
            const pct = Math.min((userArticleCount / max) * 100, 100);
            return (
              <div className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-8 mt-4 flex flex-col md:flex-row md:items-center gap-5 md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">نشرتَ {userArticleCount} مقالات</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {next
                      ? `${remainingLabel(next.required_articles_count - userArticleCount).replace("يتبقّى ", "")} يفصلك عن «${next.name}»`
                      : "كل منتجات المتجر متاحة لك"}
                  </p>
                </div>
                <div className="w-full md:w-1/2">
                  <p className="text-xs text-muted-foreground mb-2">رصيد الكاتب</p>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-left">{userArticleCount} من {max}</p>
                </div>
              </div>
            );
          })()}


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
                    className="h-full block"
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
                        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                          {isWriter ? (
                            (() => {
                              const req = product.required_articles_count || 0;
                              const remaining = Math.max(req - userArticleCount, 0);
                              const pct = req > 0 ? Math.min((userArticleCount / req) * 100, 100) : 100;
                              return (
                                <>
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                      remaining === 0
                                        ? "bg-secondary/15 text-secondary"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {remaining === 0 ? "متاح الآن" : remainingLabel(remaining)}
                                  </span>
                                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${remaining === 0 ? "bg-secondary" : "bg-primary"}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </>
                              );
                            })()
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText className="w-3 h-3" /> يتطلب {product.required_articles_count} مقالات
                            </span>
                          )}
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
