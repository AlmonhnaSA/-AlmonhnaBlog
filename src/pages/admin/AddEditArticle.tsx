import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import ArticleExtras, {
  ArticleExtrasValue,
  emptyExtras,
  loadArticleExtras,
  saveArticleExtras,
} from "@/components/editor/ArticleExtras";
import { parseSequencePoints } from "@/lib/articleExtras";

interface Product {
  id: string;
  name: string;
}

const AdminAddEditArticle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [authorId, setAuthorId] = useState<string>("");
  const [extras, setExtras] = useState<ArticleExtrasValue>(emptyExtras);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    cover_image_url: "",
    content: "",
    product_id: "",
  });


  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name")
      .order("name");
    if (productsData) setProducts(productsData);

    if (id) {
      const { data: article } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();

      if (article) {
        setAuthorId(article.author_id);
        setFormData({
          title: article.title,
          excerpt: article.excerpt,
          cover_image_url: article.cover_image_url,
          content: article.content,
          product_id: article.product_id || "",
        });
        const saved = await loadArticleExtras(id);
        setExtras({ ...saved, sequencePoints: parseSequencePoints((article as any).sequence_points) });
      }
    }
  };

  const insertMarker = (anchorKey: string, question: string) => {
    const marker = `<div class="knowledge-link-block" data-knowledge-link="${anchorKey}">${question || "وصلة معرفية"}</div>`;
    setFormData((prev) => ({ ...prev, content: `${prev.content || ""}${marker}` }));
    toast({ title: "تمت الإضافة", description: "أُدرجت الوصلة في نهاية المحتوى، يمكنك تحريكها داخل المحرر" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.excerpt || !formData.cover_image_url) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (id) {
      const sequence = extras.sequencePoints.map((p) => p.trim()).filter(Boolean);

      const { error } = await supabase
        .from("articles")
        .update({
          title: formData.title,
          excerpt: formData.excerpt,
          cover_image_url: formData.cover_image_url,
          content: formData.content,
          product_id: formData.product_id || null,
          sequence_points: sequence.length >= 3 ? sequence.slice(0, 5) : [],
        })
        .eq("id", id);

      if (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحديث المقال",
          variant: "destructive",
        });
        return;
      }

      await saveArticleExtras(id, extras);

      toast({
        title: "تم التحديث",
        description: "تم تحديث المقال بنجاح",
      });
    }

    navigate("/admin/articles");
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/articles")}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">تعديل المقال</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات المقال</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>العنوان</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان المقال"
                required
              />
            </div>

            <div>
              <Label>النبذة المختصرة</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="نبذة مختصرة عن المقال"
                rows={3}
                required
              />
            </div>

            <ImageUpload
              value={formData.cover_image_url}
              onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
              label="صورة الغلاف"
            />

            <div>
              <Label>المنتج</Label>
              <Select
                value={formData.product_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, product_id: value === "none" ? "" : value })}
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر منتجاً" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="text-right" value="none">مقال عام</SelectItem>
                  {products.map((product) => (
                    <SelectItem className="text-right" key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>المحتوى</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="اكتب محتوى المقال هنا..."
              />
            </div>

            <div className="pt-4 border-t border-border">
              <ArticleExtras
                value={extras}
                onChange={setExtras}
                currentArticleId={id}
                onInsertMarker={insertMarker}
              />
            </div>



            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate("/admin/articles")}>
                إلغاء
              </Button>
              <Button type="submit">تحديث</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAddEditArticle;
