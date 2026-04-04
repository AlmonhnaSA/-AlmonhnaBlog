import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface Writer {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
}

const Writers = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWriters();
  }, []);

  const fetchWriters = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", "approved")
        .order("name");

      if (error) throw error;
      setWriters(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل الكتاب",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">جميع الكتّاب</h1>
          <p className="text-muted-foreground">تعرف على كتابنا المتميزين في المُنحنى</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : writers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">لا يوجد كتاب حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {writers.map((writer) => (
            <Card key={writer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
  <CardContent className="p-3">
    <Link to={`/writers/${writer.id}`} className="block">
      <div className="flex items-center justify-between gap-4"> 
        {/* القسم الأول: الصورة + النصوص */}
        <div className="flex items-center gap-4">
          <Avatar className="h-24 w-24 flex-shrink-0">
            <AvatarImage src={writer.photo_url || undefined} alt={writer.name} />
            <AvatarFallback className="text-2xl">
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2 text-left">
            <h3 className="text-xl font-bold hover:text-primary transition-colors">
              {writer.name}
            </h3>
            {writer.bio && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {writer.bio}
              </p>
            )}
          </div>
        </div>

        {/* القسم الثاني: أيقونة لينكدإن */}
        {writer.linkedin_url && (
          <a
            href={writer.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center text-primary hover:text-accent transition-colors"
          >
            <Linkedin className="h-6 w-6" />
          </a>
        )}
      </div>
    </Link>
  </CardContent>
</Card>


            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Writers;
