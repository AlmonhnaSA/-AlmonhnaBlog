import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroArticleSlider from "./HeroArticleSlider";

interface Phrase {
  lead: string;
  mark: string;
  mid: string;
  mark2?: string;
  tail: string;
}

const PHRASES: Phrase[] = [
  {
    lead: "",
    mark: "الاقتصاد",
    mid: " ليس مُجرّد رقم، بل حكاية ",
    mark2: "مُجتمع",
    tail: "، نرويها بسرديّة مُختلفة",
  },
  {
    lead: "",
    mark: "الإنسان",
    mid: " يعيش نتيجة ",
    mark2: "الرقـــــــم",
    tail: " قبل أن يعرفه",
  },
  {
    lead: "ماذا لو بدأنا من ",
    mark: "الإنسان",
    mid: "",
    tail: "؟",
  },
];

export const HomeHero = () => {
  const [index, setIndex] = useState(0);

  const [pointer, setPointer] = useState({
    x: 0,
    y: 0,
  });

  const [isLeaving, setIsLeaving] = useState(false);

  const ref = useRef<HTMLElement | null>(null);

  /* =====================================================
     تبديل جمل الهيرو
  ===================================================== */

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (media.matches) return;

    const id = window.setInterval(() => {
      setIndex(
        (value) => (value + 1) % PHRASES.length
      );
    }, 6000);

    return () => {
      window.clearInterval(id);
    };
  }, []);


  /* =====================================================
     ابدأ الحكاية
     ينزل مباشرة إلى السكشن التالي
  ===================================================== */

  const start = useCallback(() => {
    const story = document.getElementById(
      "story-of-the-day"
    );

    if (!story) return;

    story.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);


  /* =====================================================
     Scroll / Wheel
  ===================================================== */

  useEffect(() => {
    const hero = ref.current;

    if (!hero) return;

    /* -----------------------------
       Wheel من الهيرو
    ----------------------------- */

    const onWheel = (event: WheelEvent) => {
      if (
        event.deltaY <= 10 ||
        window.scrollY > 16
      ) {
        return;
      }

      event.preventDefault();

      start();
    };


    /* -----------------------------
       Scroll animation
    ----------------------------- */

    let frame = 0;

    const onScroll = () => {
      window.cancelAnimationFrame(frame);

      frame = window.requestAnimationFrame(() => {
        const progress = Math.min(
          1,
          Math.max(
            0,
            window.scrollY /
              Math.max(
                hero.offsetHeight * 0.72,
                1
              )
          )
        );

        /* حركة واختفاء الهيرو */

        hero.style.setProperty(
          "--hero-scroll",
          String(progress)
        );

        hero.style.setProperty(
          "--hero-opacity",
          String(1 - progress)
        );


        /* دخول Story of the Day */

        const story =
          document.getElementById(
            "story-of-the-day"
          );

        story?.style.setProperty(
          "--story-enter",
          String(progress)
        );

        story?.style.setProperty(
          "--story-opacity",
          String(
            0.18 + progress * 0.82
          )
        );


        /* حالة خروج الهيرو */

        if (window.scrollY > 24) {
          setIsLeaving(true);
        } else if (window.scrollY <= 2) {
          setIsLeaving(false);
        }
      });
    };


    /* أول حساب */

    onScroll();


    /* Listeners */

    hero.addEventListener(
      "wheel",
      onWheel,
      { passive: false }
    );

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true }
    );


    /* Cleanup */

    return () => {
      hero.removeEventListener(
        "wheel",
        onWheel
      );

      window.removeEventListener(
        "scroll",
        onScroll
      );

      window.cancelAnimationFrame(frame);
    };
  }, [start]);


  /* =====================================================
     حركة الماوس
  ===================================================== */

  const move = (
    event: React.MouseEvent
  ) => {
    const box =
      ref.current?.getBoundingClientRect();

    if (!box) return;

    setPointer({
      x:
        (event.clientX - box.left) /
          box.width -
        0.5,

      y:
        (event.clientY - box.top) /
          box.height -
        0.5,
    });
  };


  /* =====================================================
     Parallax
  ===================================================== */

  const shift = (depth: number) => ({
    transform: `translate3d(
      ${pointer.x * depth}px,
      ${pointer.y * depth}px,
      0
    )`,
  });


  /* =====================================================
     JSX
  ===================================================== */

  return (
    <section
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() =>
        setPointer({
          x: 0,
          y: 0,
        })
      }
      className={`calm-hero ${
        isLeaving ? "is-leaving" : ""
      }`}
    >

      {/* ================================================
          Decorative Orbs
      ================================================= */}

      {/* ================================================
          Decorative Dots
      ================================================= */}

      <div
        className="calm-hero-dots"
        aria-hidden="true"
      >
        {Array.from({
          length: 14,
        }).map((_, i) => (
          <i
            key={i}
            style={{
              top: `${
                (i * 37) % 70 + 6
              }%`,

              insetInlineStart: `${
                (i * 61) % 92 + 3
              }%`,

              animationDelay: `${
                i * 0.4
              }s`,
            }}
          />
        ))}
      </div>


      {/* ================================================
          Hero Content
      ================================================= */}

      <div className="calm-hero-content">

        {/* ==========================
            النص
        =========================== */}

        <div className="calm-hero-stage">

          {PHRASES.map(
            (phrase, i) => (
              <h1
                key={i}
                aria-hidden={
                  i !== index
                }
                className={`calm-hero-phrase phrase-${
                  i + 1
                } ${
                  i === index
                    ? "is-active"
                    : ""
                }`}
              >
                {phrase.lead}

                <em className="mark">
                  {phrase.mark}
                </em>

                {phrase.mid}

                {phrase.mark2 && (
                  <em className="mark">
                    {phrase.mark2}
                  </em>
                )}

                {phrase.tail}
              </h1>
            )
          )}

        </div>


        {/* ==========================
            صور المقالات
        =========================== */}

        <div className="hero-artwork">
          <div className="calm-hero-orbs" aria-hidden="true">
            <span className="orb orb-gold" style={shift(8)} />
            <span className="orb orb-teal" style={shift(12)} />
            <span className="orb orb-bottom" style={shift(10)} />
            <span className="orb orb-left-back" style={shift(6)} />
            <span className="orb orb-right-edge" style={shift(7)} />
          </div>
          <HeroArticleSlider />
        </div>

      </div>


      {/* ================================================
          Editorial curved lines
      ================================================= */}

      <svg
        className="calm-hero-swoosh"
        viewBox="0 0 1440 620"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="swoosh-shadow swoosh-shadow-one"
          d="M-100 382 C190 535 420 458 700 286 C970 119 1190 112 1540 271"
        />
        <path
          className="swoosh-shadow swoosh-shadow-two"
          d="M-100 368 C185 515 416 441 694 273 C961 112 1191 96 1540 251"
        />
        <path
          className="swoosh-gold"
          d="M-90 387 C185 516 420 459 706 281"
        />
      </svg>


      {/* ================================================
          Start Story Button
      ================================================= */}

      <Button
        type="button"
        variant="ghost"
        onClick={start}
        className="calm-hero-cue"
        aria-label="ابدأ الحكاية"
      >
        <span>
          ابدأ الحكاية
        </span>

        <ChevronDown className="h-5 w-5" />
      </Button>

    </section>
  );
};

export default HomeHero;
