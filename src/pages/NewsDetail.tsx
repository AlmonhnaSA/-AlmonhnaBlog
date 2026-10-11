import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { ServiceGallery } from "@/components/ServiceGallery";

const NewsDetail = () => {
  const { id } = useParams();
  const { data: news, isLoading } = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select(`
          *,
          profiles:author_id (
            id,
            name,
            photo_url,
            bio
          )
        `)
        .eq("id", id)
        .eq("status", "approved")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const images = Array.isArray(news?.gallery_images)
    ? news.gallery_images.filter((image): image is string => typeof image === "string" && image.trim().length > 0)
    : [];

  return (
    <div className="min-h-screen bg-background visual-column-page">
      <TopBar />
      <Header />
      <main className="visual-column-main" dir="rtl">
        {isLoading ? (
          <div className="column-gallery-loading bg-muted animate-pulse rounded-lg" aria-label="جاري تحميل الخدمة" />
        ) : !news ? (
          <h1 className="text-2xl font-bold">الخدمة غير موجودة</h1>
        ) : (
          <>
          <div className="visual-column-heading">
            <div className="w-full min-w-0">
              <h1>{news.title}</h1>
              {news.excerpt?.trim() && (
                <p className="w-full max-w-none text-right leading-8">{news.excerpt.trim()}</p>
              )}
            </div>
          </div>
          {images.length ? (
          <ServiceGallery
            images={images}
            title={news.gallery_title || null}
            pdfUrl={news.gallery_pdf_url}
            shareUrl={`https://almonhna.sa/api/og-share?type=news&id=${id}`}
            displayUrl={`https://almonhna.sa/news/${id}`}
          />
        ) : (
          <p className="text-center text-muted-foreground py-12">لا توجد صور مضافة لهذه الخدمة حاليًا.</p>
          )}
          </>
        )}
      </main>
    </div>
  );
};

export default NewsDetail;
