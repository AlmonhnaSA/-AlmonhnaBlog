import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Download, Lock, Package, ShoppingBag, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const StoreProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userArticleCount, setUserArticleCount] = useState<number>(0);
  const [isWriter, setIsWriter] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
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

  const { data: existingRequest } = useQuery({
    queryKey: ["product-request", id, userId],
    enabled: !!userId && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_requests")
        .select("*")
        .eq("store_product_id", id)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_requests").insert({
        store_product_id: id,
        user_id: userId!,
        profile_id: profileId!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-request", id, userId] });
      toast({ title: "تم إرسال الطلب", description: "سيتم مراجعة طلبك من قبل الإدارة" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الطلب", variant: "destructive" });
    },
  });

  useEffect(() => {
    checkUserEligibility();
  }, []);

  const checkUserEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      setUserId(user.id);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasWriterRole = roles?.some(r => r.role === "writer" || r.role === "admin");
      setIsWriter(!!hasWriterRole);

      if (hasWriterRole) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setProfileId(profile.id);
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

  const canAccess = isWriter && product && userArticleCount >= product.required_articles_count;
  const isDigital = product?.product_type === "digital";

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (!canAccess) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (productLoading || loading) {
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

  // If user doesn't have access, show restricted view
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <div className="container mx-auto px-4 py-16 text-center max-w-lg">
          <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              {!isWriter
                ? "يجب أن تكون كاتباً لتتمكن من الوصول لهذا المنتج"
                : `يجب أن يكون لديك على الأقل ${product.required_articles_count} مقال منشور (لديك حالياً ${userArticleCount} مقال)`}
            </p>
            <Button variant="outline" onClick={() => navigate("/store")}>
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للمتجر
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const mainImage = selectedImage || product.image_url;

  const getRequestStatusUI = () => {
    if (!existingRequest) return null;
    const statusMap: Record<string, { icon: React.ReactNode; text: string; className: string }> = {
      pending: { icon: <Clock className="w-4 h-4" />, text: "طلبك قيد المراجعة", className: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200" },
      approved: { icon: <CheckCircle className="w-4 h-4" />, text: "تمت الموافقة على طلبك", className: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" },
      rejected: { icon: <XCircle className="w-4 h-4" />, text: existingRequest.admin_note ? `تم رفض الطلب: ${existingRequest.admin_note}` : "تم رفض طلبك", className: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" },
    };
    const s = statusMap[existingRequest.status];
    if (!s) return null;
    return (
      <div className={`border rounded-xl p-4 flex items-center gap-3 ${s.className}`}>
        {s.icon}
        <p className="font-medium text-sm">{s.text}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <div className="container mx-auto px-4 md:px-8 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/store")} className="mb-4">
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للمتجر
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            </div>

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
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
              <Badge variant={isDigital ? "default" : "secondary"} className="shrink-0 mt-1">
                {isDigital ? "رقمي" : "ملموس"}
              </Badge>
            </div>

            {product.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Digital: show files for download */}
            {isDigital && files && files.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold">الملفات المرفقة</h3>
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

            {/* Physical: show request button */}
            {!isDigital && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-5 border border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold">منتج ملموس</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    يمكنك طلب هذا المنتج وسيتم مراجعة طلبك من قبل الإدارة ثم إرساله إليك.
                  </p>

                  {getRequestStatusUI()}

                  {(!existingRequest || existingRequest.status === "rejected") && (
                    <Button
                      onClick={() => requestMutation.mutate()}
                      disabled={requestMutation.isPending}
                      className="w-full"
                    >
                      <ShoppingBag className="w-4 h-4 ml-2" />
                      {requestMutation.isPending ? "جاري الإرسال..." : "طلب المنتج"}
                    </Button>
                  )}
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
