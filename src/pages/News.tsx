
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BarChart3, Mic2, PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ServiceRequestDialog } from "@/components/ServiceRequestDialog";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
  created_at: string;
  profiles: {
    id: string;
    name: string;
    photo_url: string | null;
  };
}

const featuredServices = [
  {
    title: "صياغة المحتوى الاقتصادي",
    description:
      "نحوّل الأفكار والأرقام إلى محتوى اقتصادي واضح، دقيق، ومناسب للجمهور المستهدف",
    features: [
      "صياغة النصوص والمقالات الاقتصادية",
      "تبسيط المفاهيم والأرقام",
      "محتوى يناسب مختلف المنصات",
    ],
    icon: PenLine,
    accent: "orange",
  },
  {
    title: "إعداد المحتوى الاقتصادي",
    description:
      "نبني محتوى متكاملًا يبدأ من البحث والتحليل، وينتهي بحكاية اقتصادية مؤثرة",
    features: [
      "بحث وتحليل المعلومات",
      "بناء الفكرة والسردية",
      "إعداد محتوى متكامل",
    ],
    icon: BarChart3,
    featured: true,
    accent: "gold",
  },
  {
    title: "التعليق الصوتي",
    description:
      "نمنح النص الاقتصادي صوتًا احترافيًا يحافظ على وضوح المعلومة وحضورها",
    features: [
      "تعليق صوتي باللغة العربية",
      "أداء يناسب طبيعة المحتوى",
      "تسجيلات واضحة وجاهزة للإنتاج",
    ],
    icon: Mic2,
    accent: "green",
  },
];

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestedService, setRequestedService] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from("news")
        .select(`
          *,
          profiles (
            id,
            name,
            photo_url
          )
        `)
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل الخدمات",
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

      <main className="services-page">

        {/* المقدمة والخدمات الرئيسية */}
        <section
          className="Services-intro"
          aria-labelledby="services-title"
        >
          <div className="services-dots" aria-hidden="true" />

          <div className="container mx-auto px-8 py-12">

            <div className="">
             
              <h1 className="text-4xl font-bold mb-2 ">
                خدماتنا
              </h1>

              <p className="text-muted-foreground">
                ما نصنعه للمؤسسات والأفراد , مقسوماً الى مجموعتين
              </p>

            <div className="services-more-heading">
              <div>
               
                <h2 id="more-services-title" className="services-kicker mt-3">
                  خدمات المحتوى
                </h2>
                <p className="text-muted-foreground">
                 ما نكتبه أو نسجله أو نخرجه باسمك
                </p>
              </div>

            
            </div>
              
            </div>

            <div className="services-featured-grid">
              {featuredServices.map((service, index) => {
                const Icon = service.icon;

                return (
                  <article
                    key={service.title}
                    className={[
                      "service-featured-card",
                      service.featured ? "is-featured" : "",
                      `service-accent-${service.accent}`,
                    ].join(" ")}
                  >
                    <div className="service-card-top">
                      <span className="service-icon" aria-hidden="true">
                        <Icon />
                      </span>

                      <span className="service-card-number">
                        0{index + 1}
                      </span>
                    </div>

                    <h2>{service.title}</h2>

                    <p className="service-description">
                      {service.description}
                    </p>

                    <ul className="service-features">
                      {service.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    <Button
                      variant="ghost"
                      onClick={() => setRequestedService(service.title)}
                      className="service-action h-auto"
                    >
                      اطلب الخدمة
                      <ArrowLeft aria-hidden="true" />
                    </Button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* خدمات أخرى */}
        <section
          className="services-more"
          aria-labelledby="more-services-title"
        >
          <div className="container mx-auto px-6">

            <div className="services-more-heading">
              <div>
               
                <h2 id="more-services-title" className="services-kicker mt-3">
                  خدمات أخرى
                </h2>
                <p className="text-muted-foreground">
                 ما نبنيه معك , لا ما نسلمه لك 
                </p>
              </div>
              
              <span className="services-count">
                {news.length.toLocaleString("ar-SA")} خدمات
              </span>
            </div>

            {loading ? (
              <div
                className="services-more-grid"
                aria-label="جاري تحميل الخدمات"
              >
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="service-more-card service-more-skeleton"
                  />
                ))}
              </div>
            ) : news.length === 0 ? (
              <div className="services-empty">
                <p>لا توجد خدمات إضافية منشورة حاليًا.</p>
              </div>
            ) : (
              <div className="services-more-grid">
                {news.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="service-more-card"
                  >
                    <span
                      className="service-more-accent"
                      aria-hidden="true"
                    />

                    <div className="service-more-copy">
                      <h3>{item.title}</h3>

                      <p>{item.excerpt}</p>

                      <span className="service-more-link">
                        اكتشف المزيد
                        <ArrowLeft aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* دعوة للتواصل */}
        {/* <section
          className="services-contact"
          id="contact"
          aria-label="التواصل معنا"
        >
          <div className="container mx-auto px-6">
            <div className="services-contact-inner">
              <div>
                <h2>تحتاج حكاية مختلفة؟</h2>
                <p>
                  خلّنا نبدأ من فكرتك، ونحوّلها إلى محتوى يستحق أن يُروى.
                </p>
              </div>

              <Link to="/contact" className="services-contact-button">
                راسلنا
                <ArrowLeft aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section> */}

      </main>

      <Footer />
      <ServiceRequestDialog service={requestedService} onClose={() => setRequestedService(null)} />
    </div>
  );
};

export default News;
