import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";


/* =========================================================
   INTERACTIVE TIMELINE
   ========================================================= */

const InteractiveTimeline = ({
  stops,
  color,
}: {
  stops: any[];
  color: string;
}) => {
  /*
   * نحافظ على نظام السحب الأصلي.
   */
  const { ref, handlers } =
    useDragScroll<HTMLDivElement>();

  /*
   * النقطة النشطة.
   */
  const [active, setActive] =
    useState<string | null>(
      stops[0]?.id || null
    );

  /*
   * مقدار حركة الـTrack.
   */
  const [scrollX, setScrollX] =
    useState(0);

  /*
   * عرض المنطقة الظاهرة فعليًا.
   */
  const [
    viewportWidth,
    setViewportWidth,
  ] = useState(1200);


  /* =========================================================
     CURVE SETTINGS

     الـSVG والنقاط يستخدمون نفس نظام الإحداثيات.
     ========================================================= */

  const VIEWBOX_WIDTH = 1200;
  const VIEWBOX_HEIGHT = 200;

  /*
   * منتصف المنحنى رأسيًا.
   */
  const BASE_Y = 90;

  /*
   * قوة الانحناء.
   */
  const AMPLITUDE = 55;

  /*
   * موجة واحدة كاملة داخل الشاشة.
   */
  const WAVES = 1;

  /*
   * المسافة بين النقاط داخل الـTrack.
   */
  const STOP_GAP = 240;

  /*
   * نعطي أول وآخر نقطة مساحة حتى
   * لا تنقص الدائرة من طرف الشاشة.
   */
  const SIDE_PADDING = 80;


  /* =========================================================
     CURVE FUNCTION

     نفس الدالة تستخدم لرسم الخط
     ولحساب مكان كل دائرة.
     ========================================================= */

  const getCurveY = (
    progress: number
  ) => {
    return (
      BASE_Y +
      Math.sin(
        progress *
          Math.PI *
          2 *
          WAVES
      ) *
        AMPLITUDE
    );
  };


  /* =========================================================
     CREATE CURVE PATH

     يبدأ عند 0 وينتهي عند VIEWBOX_WIDTH.
     لا يوجد extension من البداية أو النهاية.
     ========================================================= */

  const createCurvePath = () => {
    const segments = 300;

    let path = "";

    for (
      let i = 0;
      i <= segments;
      i++
    ) {
      const progress =
        i / segments;

      const x =
        progress *
        VIEWBOX_WIDTH;

      const y =
        getCurveY(
          progress
        );

      if (i === 0) {
        path =
          `M ${x} ${y}`;
      } else {
        path +=
          ` L ${x} ${y}`;
      }
    }

    return path;
  };

  const curvePath =
    createCurvePath();


  /* =========================================================
     TRACK WIDTH

     الخط نفسه يبقى بعرض الشاشة.

     الـTrack الخاص بالنقاط فقط هو الذي
     يتمدد عندما يزيد عدد النقاط.
     ========================================================= */

  const trackWidth =
    Math.max(
      viewportWidth,

      SIDE_PADDING * 2 +
        Math.max(
          stops.length - 1,
          0
        ) *
          STOP_GAP
    );


  /* =========================================================
     VIEWPORT + SCROLL
     ========================================================= */

  useEffect(() => {
    const element =
      ref.current;

    if (!element) {
      return;
    }

    /*
     * نأخذ عرض المنطقة الحقيقي بدل
     * الاعتماد على window.innerWidth.
     */
    const updateViewport =
      () => {
        setViewportWidth(
          element.clientWidth ||
            1200
        );
      };

    /*
     * مقدار السحب في RTL يختلف بين
     * المتصفحات، لذلك نحتاج القيمة المطلقة.
     */
    const updateScroll =
      () => {
        setScrollX(
          Math.abs(
            element.scrollLeft
          )
        );
      };

    updateViewport();
    updateScroll();

    const observer =
      new ResizeObserver(
        updateViewport
      );

    observer.observe(
      element
    );

    element.addEventListener(
      "scroll",
      updateScroll,
      {
        passive: true,
      }
    );

    return () => {
      observer.disconnect();

      element.removeEventListener(
        "scroll",
        updateScroll
      );
    };
  }, [ref]);


  /* =========================================================
     RESET ACTIVE STOP
     ========================================================= */

  useEffect(() => {
    setActive(
      stops[0]?.id ||
        null
    );
  }, [stops]);


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div
      className="timeline-fixed-shell"
      style={
        {
          "--timeline-color":
            color,
        } as React.CSSProperties
      }
    >
      {/* =====================================================
          FIXED CURVE

          المنحنى ثابت داخل الجزء الظاهر.
          لا يتمدد مع عدد النقاط.
          ===================================================== */}

      <svg
        className="timeline-journey-line"
        viewBox={
          `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`
        }
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={curvePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>


      {/* =====================================================
          SCROLL AREA
          ===================================================== */}

      <div
        ref={ref}
        {...handlers}
        dir="rtl"
        className="
          drag-scroll
          timeline-journey-wrap
        "
      >
        {/* ===================================================
            MOVING TRACK

            هذا فقط يتمدد ويتحرك.
            =================================================== */}

        <div
          className="
            timeline-journey-stage
          "
          style={{
            width:
              `${trackWidth}px`,
          }}
        >
          <div
            className="
              timeline-journey
            "
          >
            {stops.map(
              (
                stop,
                i
              ) => {
                /* ===========================================
                   X داخل الـTrack من اليمين
                   =========================================== */

                const pointFromRight =
                  SIDE_PADDING +
                  i *
                    STOP_GAP;


                /* ===========================================
                   X الحالي بعد السحب
                   =========================================== */

                const visibleFromRight =
                  pointFromRight -
                  scrollX;


                /*
                 * SVG يبدأ X من اليسار،
                 * بينما ترتيبنا RTL.
                 */
                const visibleX =
                  viewportWidth -
                  visibleFromRight;


                /* ===========================================
                   X -> PROGRESS

                   لا نستخدم clamp.

                   لو النقطة خارج الشاشة تستمر
                   المعادلة طبيعيًا، لذلك عندما
                   تدخل الشاشة لا تقفز.
                   =========================================== */

                const progress =
                  viewportWidth > 0
                    ? visibleX /
                      viewportWidth
                    : 0.5;


                /* ===========================================
                   Y

                   هذه بالضبط نفس الدالة
                   المستخدمة لرسم الخط.
                   =========================================== */

                const curveY =
                  getCurveY(
                    progress
                  );


                /*
                 * نحول Y من إحداثيات SVG
                 * إلى نسبة مئوية.

                 * الـCSS سيستخدم نفس ارتفاع
                 * الـSVG وبالتالي لا نعتمد
                 * على 160px أو rem ثابتة.
                 */
              const dotYRem =
  (
    curveY /
    VIEWBOX_HEIGHT
  ) *
  10;


                /* ===========================================
                   STOP CONTENT
                   =========================================== */

                const body = (
                  <div
                    className={
                      `timeline-stop ${
                        active ===
                        stop.id
                          ? "is-active"
                          : ""
                      }`
                    }
                  style={
  {
    "--dot-y":
      `${dotYRem}rem`,
  } as React.CSSProperties
}
                    onMouseEnter={
                      () =>
                        setActive(
                          stop.id
                        )
                    }
                    onClick={
                      () =>
                        setActive(
                          stop.id
                        )
                    }
                  >
                    {/* ===============================
                        DOT
                        =============================== */}

                    <span
                      className="
                        timeline-dot
                      "
                    >
                      {String(
                        i + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>


                    {/* ===============================
                        IMAGE
                        =============================== */}

                    {stop.image_url && (
                      <div
                        className="
                          timeline-stop-image
                        "
                      >
                        <img
                          src={
                            stop.image_url
                          }
                          alt={
                            stop.title
                          }
                          loading="lazy"
                          draggable={
                            false
                          }
                        />
                      </div>
                    )}


                    {/* ===============================
                        COPY
                        =============================== */}

                    <div
                      className="
                        timeline-stop-copy
                      "
                    >
                      {stop.label && (
                        <h6>
                          {
                            stop.label
                          }
                        </h6>
                      )}

                      <h4>
                        {
                          stop.title
                        }
                      </h4>

                      {stop.description && (
                        <p>
                          {
                            stop.description
                          }
                        </p>
                      )}
                    </div>
                  </div>
                );


                /* ===========================================
                   LINKED ARTICLE
                   =========================================== */

                if (
                  stop.article_id &&
                  stop.articles
                    ?.status ===
                    "approved"
                ) {
                  return (
                    <Link
                      key={
                        stop.id
                      }
                      to={
                        `/articles/${stop.article_id}`
                      }
                      draggable={
                        false
                      }
                    >
                      {body}
                    </Link>
                  );
                }


                /* ===========================================
                   NORMAL STOP
                   =========================================== */

                return (
                  <div
                    key={
                      stop.id
                    }
                  >
                    {body}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


/* =========================================================
   IMAGE TIMELINE
   ========================================================= */

const ImageTimeline = ({
  timeline,
}: {
  timeline: any;
}) => {
  const { ref, handlers } =
    useDragScroll<HTMLDivElement>();

  if (
    !timeline.image_url
  ) {
    return null;
  }

  return (
    <div
      ref={ref}
      {...handlers}
      className="
        drag-scroll
        image-timeline-stage
      "
    >
      <img
        src={
          timeline.image_url
        }
        alt={
          timeline.title
        }
        loading="lazy"
        draggable={
          false
        }
      />
    </div>
  );
};


/* =========================================================
   HOME TIMELINES
   ========================================================= */

export const HomeTimelines =
  () => {
    /* =======================================================
       GET TIMELINES
       ======================================================= */

    const {
      data: timelines,
    } = useQuery({
      queryKey: [
        "home-timelines",
      ],

      queryFn:
        async () => {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "timelines"
              )
              .select(`
                *,
                timeline_stops (
                  id,
                  label,
                  title,
                  description,
                  image_url,
                  article_id,
                  display_order,
                  articles:article_id (
                    id,
                    status
                  )
                )
              `)
              .eq(
                "is_active",
                true
              )
              .order(
                "display_order",
                {
                  ascending:
                    true,
                }
              );

          if (error) {
            throw error;
          }

          return (
            data || []
          );
        },
    });


    /* =======================================================
       ACTIVE TIMELINE
       ======================================================= */

    const [
      activeId,
      setActiveId,
    ] =
      useState<
        string | null
      >(null);


    /* =======================================================
       VISIBLE TIMELINES
       ======================================================= */

    const visible =
      (
        timelines || []
      ).filter(
        (t: any) => {
          const stops =
            t.timeline_stops ||
            [];

          return (
            t.timeline_type ===
            "image"
              ? !!t.image_url
              : stops.length >
                0
          );
        }
      );


    /* =======================================================
       SELECT FIRST TIMELINE
       ======================================================= */

    useEffect(
      () => {
        if (
          visible.length &&
          !visible.some(
            (t: any) =>
              t.id ===
              activeId
          )
        ) {
          setActiveId(
            visible[0].id
          );
        }
      },
      [
        visible,
        activeId,
      ]
    );


    /* =======================================================
       EMPTY
       ======================================================= */

    if (
      !visible.length
    ) {
      return null;
    }


    /* =======================================================
       CURRENT TIMELINE
       ======================================================= */

    const active: any =
      visible.find(
        (t: any) =>
          t.id ===
          activeId
      ) ||
      visible[0];


    /* =======================================================
       SORT STOPS
       ======================================================= */

 const stops = [
  ...(active.timeline_stops || []),
].sort((a: any, b: any) => {

  const getYear = (value: unknown) => {
    if (value === null || value === undefined) {
      return Number.MAX_SAFE_INTEGER;
    }

    const text = String(value);

    const match = text.match(/\d{4}/);

    return match
      ? Number(match[0])
      : Number.MAX_SAFE_INTEGER;
  };

  return (
    getYear(a.label) -
    getYear(b.label)
  );
});


    const isImage =
      active.timeline_type ===
      "image";


    /* =======================================================
       PAGE
       ======================================================= */

    return (
      <section
        className="
          timelines-section
        "
      >
        {/* ===================================================
            HEADING
            =================================================== */}

        <div
          className="
            container
            mx-auto
            px-6
          "
        >
          <Reveal
            variant="side"
            className="
              section-heading-row timeline-reference-heading
            "
          >
            <div>
              <p
                className="
                  editorial-kicker
                "
              >
                لا شيء يقع فجأة
              </p>

              <h2
                className="
                  editorial-heading
                  mt-2
                "
              >
                خطوط المُنحنى
              </h2>
            </div>

          </Reveal>


          {/* =================================================
              TIMELINE BUTTONS
              ================================================= */}

          <Reveal
            variant="side"
            className="
              timeline-reference-tabs
            "
          >
            <div className="timeline-title-tabs" dir="rtl" aria-label="خطوط المُنحنى">
              {visible.map((t: any) => (
                <Button
                  key={t.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveId(t.id)}
                  aria-pressed={t.id === active.id}
                  className={`timeline-title-tab ${t.id === active.id ? "is-active" : ""}`}
                >
                  {t.title}
                </Button>
              ))}
            </div>
          </Reveal>
        </div>


        {/* ===================================================
            TIMELINE
            =================================================== */}

        <Reveal
          key={
            active.id
          }
          variant="clip"
          className="
            mt-8
            md:mt-12
          "
        >
          {/* =================================================
              DESCRIPTION
              ================================================= */}

          {active.description && (
            <div
              className="
                container
                mx-auto
                mb-7
                px-6
              "
            >
              <p
                className="
                  max-w-2xl
                  text-muted-foreground
                "
              >
                {
                  active.description
                }
              </p>
            </div>
          )}


          {/* =================================================
              CONTENT
              ================================================= */}

          {isImage ? (
            <div
              className="
                container
                mx-auto
                px-6
              "
            >
              <ImageTimeline
                timeline={
                  active
                }
              />
            </div>
          ) : (
            <InteractiveTimeline
              key={
                active.id
              }
              stops={
                stops
              }
              color={
                active.color ||
                "#00343A"
              }
            />
          )}
        </Reveal>
      </section>
    );
  };


export default HomeTimelines;
