import { useDashboardSearch } from "@/components/DashboardSearch";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import QuoteCardGallery from "@/components/quote/QuoteCardGallery";
import { QuoteCardData, QuoteSize } from "@/components/quote/QuoteCardPreview";

interface AdminQuoteCard extends QuoteCardData {
  id: string;
  created_at: string;
}

const ManageQuoteCards = () => {
  const search = useDashboardSearch();
  const { toast } = useToast();
  const [cards, setCards] = useState<AdminQuoteCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("quote_cards")
      .select("*")
      .order("created_at", { ascending: false });
    setCards(((data as any[]) || []).map((c) => ({ ...c, size: c.size as QuoteSize })));
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("quote_cards").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "تعذر حذف البطاقة", variant: "destructive" });
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "تم الحذف" });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">بطاقات الاقتباس</h1>
        <p className="text-muted-foreground">كل البطاقات التي أضافها الكتّاب.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البطاقات ({cards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">جاري التحميل...</p>
          ) : cards.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد بطاقات بعد.</p>
          ) : (
            <QuoteCardGallery cards={search(cards) as any} onDelete={handleDelete} showWriter />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageQuoteCards;
