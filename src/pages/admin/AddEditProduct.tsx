import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

export const AddEditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    display_order: 0,
  });

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        image_url: product.image_url,
        display_order: product.display_order || 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.image_url) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (id) {
      const { error } = await supabase
        .from("products")
        .update(formData)
        .eq("id", id);

      if (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحديث المنتج",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "تم التحديث",
        description: "تم تحديث المنتج بنجاح",
      });
    } else {
      const { error } = await supabase.from("products").insert([formData]);

      if (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إضافة المنتج",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "تم الإضافة",
        description: "تم إضافة المنتج بنجاح",
      });
    }

    navigate("/admin/products");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/products")}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">{id ? "تعديل المنتج" : "إضافة منتج جديد"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات المنتج</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>اسم المنتج</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="اسم المنتج"
                required
              />
            </div>

            <div>
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف المنتج"
                rows={3}
              />
            </div>

            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              label="صورة المنتج"
            />

            <div>
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate("/admin/products")}>
                إلغاء
              </Button>
              <Button type="submit">
                {id ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEditProduct;
