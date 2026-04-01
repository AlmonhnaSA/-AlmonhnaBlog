import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Plus, Trash2, Upload, X } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface SubImage {
  id?: string;
  image_url: string;
  display_order: number;
}

interface ProductFile {
  id?: string;
  file_url: string;
  file_name: string;
  file_size: number;
}

export const AddEditStoreProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    required_articles_count: 0,
    display_order: 0,
    product_type: "digital",
  });

  const [subImages, setSubImages] = useState<SubImage[]>([]);
  const [files, setFiles] = useState<ProductFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    const { data: product } = await supabase
      .from("store_products")
      .select("*")
      .eq("id", id)
      .single();

    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        image_url: product.image_url,
        required_articles_count: product.required_articles_count,
        display_order: product.display_order || 0,
        product_type: (product as any).product_type || "digital",
      });
    }

    const { data: images } = await supabase
      .from("store_product_images")
      .select("*")
      .eq("store_product_id", id)
      .order("display_order", { ascending: true });

    if (images) setSubImages(images.map(img => ({ id: img.id, image_url: img.image_url, display_order: img.display_order || 0 })));

    const { data: productFiles } = await supabase
      .from("store_product_files")
      .select("*")
      .eq("store_product_id", id);

    if (productFiles) setFiles(productFiles.map(f => ({ id: f.id, file_url: f.file_url, file_name: f.file_name, file_size: Number(f.file_size) || 0 })));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    const newFiles: ProductFile[] = [];
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const uniqueName = `${userData.user.id}/${crypto.randomUUID()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("store-files")
          .upload(uniqueName, file);

        if (uploadError) {
          console.error(`Upload error for file ${file.name}:`, uploadError);
          toast({ title: `خطأ في رفع ${file.name}`, description: uploadError.message, variant: "destructive" });
          continue; // skip this file but continue with others
        }

        const { data: { publicUrl } } = supabase.storage
          .from("store-files")
          .getPublicUrl(uniqueName);

        newFiles.push({
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
        });
      }

      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
        toast({ title: `تم رفع ${newFiles.length} ملف بنجاح` });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "خطأ في رفع الملفات", description: error?.message || "خطأ غير معروف", variant: "destructive" });
    } finally {
      setUploading(false);
      // Reset file input so same files can be re-selected
      event.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addSubImage = () => {
    setSubImages(prev => [...prev, { image_url: "", display_order: prev.length }]);
  };

  const removeSubImage = (index: number) => {
    setSubImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.image_url) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    try {
      let productId = id;

      if (id) {
        const { error } = await supabase.from("store_products").update(formData).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("store_products").insert([formData]).select().single();
        if (error) throw error;
        productId = data.id;
      }

      // Handle sub-images: delete old ones and insert new
      if (id) {
        await supabase.from("store_product_images").delete().eq("store_product_id", id);
      }
      if (subImages.length > 0) {
        const validImages = subImages.filter(img => img.image_url);
        if (validImages.length > 0) {
          await supabase.from("store_product_images").insert(
            validImages.map((img, i) => ({
              store_product_id: productId,
              image_url: img.image_url,
              display_order: i,
            }))
          );
        }
      }

      // Handle files: delete old ones and insert new
      if (id) {
        await supabase.from("store_product_files").delete().eq("store_product_id", id);
      }
      if (files.length > 0) {
        await supabase.from("store_product_files").insert(
          files.map(f => ({
            store_product_id: productId,
            file_url: f.file_url,
            file_name: f.file_name,
            file_size: f.file_size,
          }))
        );
      }

      toast({ title: id ? "تم التحديث" : "تم الإضافة", description: id ? "تم تحديث المنتج بنجاح" : "تم إضافة المنتج بنجاح" });
      navigate("/admin/store");
    } catch (error) {
      console.error(error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حفظ المنتج", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/store")}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">{id ? "تعديل منتج المتجر" : "إضافة منتج للمتجر"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>بيانات المنتج الأساسية</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>اسم المنتج *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="اسم المنتج" required />
            </div>
            <div>
              <Label>النبذة</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="وصف المنتج" rows={3} />
            </div>
            <ImageUpload value={formData.image_url} onChange={(url) => setFormData({ ...formData, image_url: url })} label="الصورة الرئيسية *" />
            <div>
              <Label>نوع المنتج</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="product_type" value="digital" checked={formData.product_type === "digital"} onChange={() => setFormData({ ...formData, product_type: "digital" })} />
                  <span className="text-sm">رقمي (تحميل ملفات)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="product_type" value="physical" checked={formData.product_type === "physical"} onChange={() => setFormData({ ...formData, product_type: "physical" })} />
                  <span className="text-sm">ملموس (يتم طلبه)</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>عدد المقالات المطلوبة</Label>
                <Input type="number" min={0} value={formData.required_articles_count} onChange={(e) => setFormData({ ...formData, required_articles_count: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>ترتيب العرض</Label>
                <Input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sub Images */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>الصور الفرعية</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addSubImage}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة صورة
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subImages.length === 0 && <p className="text-sm text-muted-foreground">لا توجد صور فرعية</p>}
            {subImages.map((img, index) => (
              <div key={index} className="flex items-start gap-3 border rounded-lg p-3">
                <div className="flex-1">
                  <ImageUpload value={img.image_url} onChange={(url) => {
                    const updated = [...subImages];
                    updated[index].image_url = url;
                    setSubImages(updated);
                  }} label={`صورة فرعية ${index + 1}`} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSubImage(index)} className="mt-6">
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader><CardTitle>الملفات المرفقة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>رفع ملفات</Label>
              <Input type="file" multiple onChange={handleFileUpload} disabled={uploading} className="cursor-pointer" />
              {uploading && <p className="text-sm text-muted-foreground mt-1">جاري الرفع...</p>}
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/store")}>إلغاء</Button>
          <Button type="submit">{id ? "تحديث" : "إضافة"}</Button>
        </div>
      </form>
    </div>
  );
};

export default AddEditStoreProduct;
