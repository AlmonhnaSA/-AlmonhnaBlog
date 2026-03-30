import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ManageStoreProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_products")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-store-products"] });
      toast({ title: "تم الحذف بنجاح" });
    },
  });

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">إدارة المتجر</h1>
        <Link to="/admin/store/add">
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            إضافة منتج
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <Card key={product.id} className="p-4">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-48 object-cover rounded mb-3"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{product.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                الحد الأدنى للمقالات: {product.required_articles_count}
              </p>
            </div>
            <div className="flex gap-2 mt-auto pt-2">
              <Link to={`/admin/store/edit/${product.id}`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate(product.id)}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {products?.length === 0 && (
        <p className="text-center text-muted-foreground py-8">لا توجد منتجات في المتجر</p>
      )}
    </div>
  );
};

export default ManageStoreProducts;
