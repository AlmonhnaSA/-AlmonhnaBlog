import { SearchInput } from "@/components/DashboardSearch";
import { searchItems } from "@/lib/searchItems";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Pause,
  Play,
  Headphones,
  Clock3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Episode {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration_label: string | null;
}

const EPISODES_PER_PAGE = 10;

const AudioEpisodes = () => {
  const [query, setQuery] = useState("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    supabase
      .from("audio_episodes")
      .select(
        "id, title, description, category, audio_url, cover_image_url, duration_label"
      )
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        setEpisodes((data as Episode[]) || []);
      });

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const changePlaybackRate = (speed: number) => {
    setPlaybackRate(speed);

    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const filteredEpisodes = searchItems(episodes, query);
  const totalPages = Math.ceil(
    filteredEpisodes.length / EPISODES_PER_PAGE
  );

  const paginatedEpisodes = filteredEpisodes.slice(
    (currentPage - 1) * EPISODES_PER_PAGE,
    currentPage * EPISODES_PER_PAGE
  );

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    // إيقاف الصوت عند تغيير الصفحة
    audioRef.current?.pause();
    audioRef.current = null;

    setPlayingId(null);
    setProgress(0);
    setCurrentPage(page);

    // الرجوع لأعلى قسم الحلقات
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggle = async (episode: Episode) => {
    const currentAudio = audioRef.current;

    // =========================================
    // نفس الحلقة
    // =========================================

    if (
      playingId === episode.id &&
      currentAudio
    ) {
      if (currentAudio.paused) {
        try {
          currentAudio.playbackRate = playbackRate;

          await currentAudio.play();

          setPlayingId(episode.id);
        } catch {
          setPlayingId(null);
        }
      } else {
        currentAudio.pause();
        setPlayingId(null);
      }

      return;
    }

    // =========================================
    // أوقف الحلقة السابقة
    // =========================================

    currentAudio?.pause();

    // =========================================
    // إنشاء Audio جديد
    // =========================================

    const audio = new Audio(episode.audio_url);

    // تطبيق سرعة التشغيل الحالية
    audio.playbackRate = playbackRate;

    audioRef.current = audio;

    setPlayingId(episode.id);
    setProgress(0);

    // =========================================
    // تحديث Progress
    // =========================================

    audio.ontimeupdate = () => {
      if (
        Number.isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        setProgress(
          (audio.currentTime / audio.duration) * 100
        );
      }
    };

    // =========================================
    // نهاية الحلقة
    // =========================================

    audio.onended = () => {
      setPlayingId(null);
      setProgress(0);
    };

    // =========================================
    // خطأ في الصوت
    // =========================================

    audio.onerror = () => {
      setPlayingId(null);
      setProgress(0);
    };

    // =========================================
    // تشغيل
    // =========================================

    try {
      await audio.play();
    } catch {
      setPlayingId(null);
      setProgress(0);
    }
  };

  return (
    <div
      className="audio-archive-page"
      dir="rtl"
    >
      <TopBar />

      <Header />

      <main className="audio-archive container mx-auto px-8 py-12">

        {/* =========================================
            Intro
        ========================================= */}

        <section className="audio-archive-intro">

          {/* <div className="audio-archive-kicker">
            <Headphones />
            <span>مسموع</span>
          </div> */}

          <h1>
            أصواتٌ تُسمع
            <br />
            <em>وحكاياتٌ تبقى</em>
          </h1>
          <SearchInput value={query} onChange={(v) => { setQuery(v); setCurrentPage(1); }} placeholder="ابحث في الحلقات…" className="mx-auto my-5" />

          <p>
            حلقات المُنحنى الصوتية؛
            أفكار وحكايات تأخذك إلى زاوية
            أخرى من الحكاية
          </p>

        </section>


        {/* =========================================
            Episodes
        ========================================= */}

        {episodes.length === 0 ? (

          <section className="audio-archive-empty">
            <Headphones />
            <p>لا توجد حلقات بعد.</p>
          </section>

        ) : (

          <>
            <section className="audio-archive-list">

              {paginatedEpisodes.map((episode, index) => {

                const isPlaying =
                  playingId === episode.id;

                return (
                  <article
                    key={episode.id}
                    className={`audio-episode-card ${
                      isPlaying
                        ? "is-playing"
                        : ""
                    }`}
                    style={
                      {
                        "--audio-index":
                          index,
                      } as React.CSSProperties
                    }
                  >

                    {/* =================================
                        الصورة
                    ================================= */}

                    <div className="audio-episode-media">

                      {episode.cover_image_url ? (

                        <img
                          src={
                            episode.cover_image_url
                          }
                          alt={episode.title}
                          loading={
                            index < 2
                              ? "eager"
                              : "lazy"
                          }
                        />

                      ) : (

                        <div className="audio-episode-media-placeholder">
                          <Headphones />
                        </div>

                      )}

                      <div className="audio-episode-media-overlay" />

                    </div>


                    {/* =================================
                        المحتوى
                    ================================= */}

                    <div className="audio-episode-content">

                      {/* Top */}

                      <div className="audio-episode-top">

                        {episode.category && (
                          <span className="audio-episode-category">
                            {episode.category}
                          </span>
                        )}

                        {episode.duration_label && (
                          <span className="audio-episode-duration">
                            <Clock3 />
                            {episode.duration_label}
                          </span>
                        )}

                      </div>


                      {/* Title */}

                      <h2>
                        {episode.title}
                      </h2>


                      {/* Description */}

                      {episode.description && (
                        <p className="audio-episode-description">
                          {episode.description}
                        </p>
                      )}


                      {/* =================================
                          Audio Controls
                      ================================= */}

                      <div className="audio-episode-controls">

                        {/* Play / Pause */}

                        <button
                          type="button"
                          className="audio-episode-play"
                          onClick={() =>
                            toggle(episode)
                          }
                          aria-label={
                            isPlaying
                              ? "إيقاف الحلقة"
                              : "تشغيل الحلقة"
                          }
                        >

                          {isPlaying ? (
                            <Pause />
                          ) : (
                            <Play />
                          )}

                        </button>


                        {/* =================================
                            Playback Speed
                        ================================= */}

                        <Popover>

                          <PopoverTrigger asChild>

                            <button
                              type="button"
                              className="audio-speed"
                              aria-label="سرعة التشغيل"
                            >
                              {playbackRate}×
                            </button>

                          </PopoverTrigger>


                          <PopoverContent
                            side="top"
                            align="center"
                            sideOffset={10}
                            className="audio-speed-popover"
                          >

                            <div className="audio-speed-menu__title">
                              سرعة التشغيل
                            </div>


                            <div className="audio-speed-options">

                              {[
                                0.75,
                                1,
                                1.25,
                                1.5,
                                1.75,
                                2,
                              ].map((speed) => (

                                <button
                                  key={speed}
                                  type="button"
                                  className={`audio-speed-option ${
                                    playbackRate ===
                                    speed
                                      ? "is-active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    changePlaybackRate(
                                      speed
                                    )
                                  }
                                >
                                  {speed}×
                                </button>

                              ))}

                            </div>

                          </PopoverContent>

                        </Popover>


                        {/* =================================
                            Progress
                        ================================= */}

                        <div className="audio-episode-progress">

                          <div className="audio-episode-progress-track">

                            <span
                              style={{
                                width:
                                  isPlaying
                                    ? `${progress}%`
                                    : "0%",
                              }}
                            />

                          </div>


                          {/* Waveform */}

                          <div className="audio-episode-wave">

                            {Array.from(
                              { length: 24 },
                              (_, i) => (

                                <i
                                  key={i}
                                  className={
                                    isPlaying &&
                                    (i / 23) *
                                      100 <=
                                      progress
                                      ? "is-played"
                                      : ""
                                  }
                                />

                              )
                            )}

                          </div>

                        </div>

                      </div>

                    </div>

                  </article>
                );
              })}

            </section>

{/* Pagination - RTL Arabic */}

{totalPages > 1 && (
  <nav
    className="audio-pagination"
    aria-label="التنقل بين صفحات الحلقات"
    dir="rtl"
  >
    {/* السابق */}
    <button
      type="button"
      className="audio-pagination-arrow"
      onClick={() => goToPage(currentPage - 1)}
      disabled={currentPage === 1}
      aria-label="السابق"
    >
      <span>→</span>
    </button>

    {/* أرقام الصفحات */}
    <div className="audio-pagination-pages" dir="rtl">
      {Array.from(
        { length: totalPages },
        (_, index) => index + 1
      ).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => goToPage(page)}
          className={`audio-pagination-page ${
            currentPage === page ? "is-active" : ""
          }`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {String(page).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)])}
        </button>
      ))}
    </div>

    {/* التالي */}
    <button
      type="button"
      className="audio-pagination-arrow"
      onClick={() => goToPage(currentPage + 1)}
      disabled={currentPage === totalPages}
      aria-label="التالي"
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

export default AudioEpisodes;
