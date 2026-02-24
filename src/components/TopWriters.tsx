import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Writer {
  id: string;
  name: string;
  photo_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  bio?: string;
  article_count: number;
}

export const TopWriters = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTopWriters();
  }, []);

  const fetchTopWriters = async () => {
    try {
      const { data: articlesData, error: articlesError } = await supabase
        .from("articles")
        .select("author_id")
        .eq("status", "approved");

      if (articlesError) throw articlesError;

      const { data: newsData, error: newsError } = await supabase
        .from("news")
        .select("author_id")
        .eq("status", "approved");

      if (newsError) throw newsError;

      const authorCounts: Record<string, number> = {};
      [...(articlesData || []), ...(newsData || [])].forEach((item) => {
        authorCounts[item.author_id] = (authorCounts[item.author_id] || 0) + 1;
      });

      const topAuthorIds = Object.entries(authorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, photo_url, linkedin_url, twitter_url, bio")
        .in("id", topAuthorIds)
        .eq("status", "approved");

      if (profilesError) throw profilesError;

      const writersWithCounts = profiles?.map((profile) => ({
        ...profile,
        article_count: authorCounts[profile.id] || 0,
      })) || [];

      writersWithCounts.sort((a, b) => b.article_count - a.article_count);
      setWriters(writersWithCounts);
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
  <h3 className="text-xl font-bold mb-4">كتّاب المُنحنى</h3>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {writers.slice(0, 8).map((writer) => (
      <Card
        key={writer.id}
        className="overflow-hidden hover:shadow-lg transition-shadow"
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/writers/${writer.id}`}
              className="flex items-center gap-3 flex-1"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={writer.photo_url} alt={writer.name} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold transition-colors">
                  {writer.name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {writer.bio
                    ? writer.bio.split(' ').slice(0, 5).join(' ') +
                      (writer.bio.split(' ').length > 5 ? '...' : '')
                    : 'كاتب متميز'}
                </p>
              </div>
            </Link>

            <div className="flex gap-2">
              {writer.twitter_url && (
                <a
                  href={writer.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: '2.2px', color: '#00343a' }}
                  className="hover:text-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </a>
              )}
              {writer.linkedin_url && (
                <a
                  href={writer.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#00343a' }}
                  className="hover:text-accent transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
</div>
  );
};
