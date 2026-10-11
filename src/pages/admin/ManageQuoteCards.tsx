import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import QuoteCardPreview, { QuoteCardData, QuoteSize } from "@/components/quote/QuoteCardPreview";

interface AdminQuoteCard extends QuoteCardData {
  id: string;
  created_at: string;
}

const ManageQuoteCards = () => {
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <div key={c.id} className="space-y-2">
                  <QuoteCardPreview data={c} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.writer_name}</span>
                    <span>{new Date(c.created_at).toLocaleDateString("ar")}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-4 h-4 ml-1" /> حذف
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageQuoteCards;
