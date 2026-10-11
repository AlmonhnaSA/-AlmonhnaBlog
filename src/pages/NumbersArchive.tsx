import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Hash } from "lucide-react";

interface NumberItem {
  id: string;
  number_value: string;
  title: string;
  description: string | null;
  source: string | null;
}

const ITEMS_PER_PAGE = 10;

const toArabicNumber = (value: number) => {
  return String(value).replace(
    /\d/g,
    (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]
  );
};

const NumbersArchive = () => {
  const [items, setItems] = useState<NumberItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNumbers = async () => {
      const { data, error } = await supabase
        .from("number_stories")
        .select(
          "id, number_value, title, description, source"
        )
        .eq("is_active", true)
        .order("display_order");

      if (!error) {
        setItems((data as NumberItem[]) || []);
      }

      setLoading(false);
    };

    fetchNumbers();
  }, []);

  // =========================================
  // Pagination
  // =========================================

  const totalPages = Math.ceil(
    items.length / ITEMS_PER_PAGE
  );

  const paginatedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="numbers-archive-page"
      dir="rtl"
    >
      <TopBar />
      <Header />

      <main className="numbers-archive container mx-auto px-8 py-12">

        {/* =========================================
            INTRO
        ========================================== */}

        <section className="numbers-intro">

        
          <h1>
            أرقام صغيرة
            <br />
            <em>تحكي حكايات كبيرة</em>
          </h1>

          <p>
            مجموعة من الأرقام التي مرّت في
            المُنحنى، وكل رقم منها يخفي خلفه
            قصة تستحق أن تُروى
          </p>

        </section>


        {/* =========================================
            CONTENT
        ========================================== */}

        {loading ? (

          <section className="numbers-list">
            <div className="numbers-list-line" aria-hidden="true" />

            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="number-story animate-pulse"
              >
                <div className="number-story-value">
                  <div className="h-12 w-24 rounded bg-muted" />
                </div>

                <div className="number-story-content space-y-3">
                  <div className="h-5 w-32 rounded bg-muted" />
                  <div className="h-7 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </section>

        ) : items.length === 0 ? (

          <section className="numbers-empty">
            <span>—</span>
            <p>لا توجد أرقام بعد.</p>
          </section>

        ) : (

          <>

            {/* =========================================
                NUMBERS LIST
            ========================================== */}

            <section
              className="numbers-list"
              key={currentPage}
            >

              <div
                className="numbers-list-line"
                aria-hidden="true"
              />

              {paginatedItems.map((item, index) => (

                <article
                  key={item.id}
                  className="number-story"
                  style={{
                    "--number-index": index,
                  } as React.CSSProperties}
                >

                  {/* الرقم */}

                  <div className="number-story-value">

                    <strong>
                      {item.number_value}
                    </strong>

                  </div>


                  {/* القصة */}

                  <div className="number-story-content">

                    <div className="number-story-top">

                      {item.source && (
                        <small>
                          المصدر: {item.source}
                        </small>
                      )}

                    </div>

                    <h2>
                      {item.title}
                    </h2>

                    {item.description && (
                      <p>
                        {item.description}
                      </p>
                    )}

                  </div>

                </article>

              ))}

            </section>


            {/* =========================================
                PAGINATION
            ========================================== */}

            {totalPages > 1 && (

              <nav
                className="audio-pagination"
                aria-label="التنقل بين صفحات الأرقام"
                dir="rtl"
              >

                {/* السابق */}

                <button
                  type="button"
                  className="audio-pagination-arrow"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="الصفحة السابقة"
                  title="الصفحة السابقة"
                >
                  <span>→</span>
                </button>


                {/* أرقام الصفحات */}

                <div
                  className="audio-pagination-pages"
                  dir="rtl"
                >

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (

                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`audio-pagination-page ${
                        currentPage === page
                          ? "is-active"
                          : ""
                      }`}
                      aria-current={
                        currentPage === page
                          ? "page"
                          : undefined
                      }
                      aria-label={`الصفحة ${toArabicNumber(page)}`}
                    >
                      {toArabicNumber(page)}
                    </button>

                  ))}

                </div>


                {/* التالي */}

                <button
                  type="button"
                  className="audio-pagination-arrow"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="الصفحة التالية"
                  title="الصفحة التالية"
                >
                  <span>←</span>
                </button>

              </nav>

            )}

          </>

        )}

      </main>

      <Footer />
    </div>
  );
};

export default NumbersArchive;
