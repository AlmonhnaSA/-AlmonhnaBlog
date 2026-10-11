import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import Reveal from "@/components/motion/Reveal";
import {
  Headphones,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
  episode_date: string | null;
  is_featured: boolean;
}

const AudioSection = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    supabase
      .from("audio_episodes")
      .select(
        "id, title, description, category, audio_url, cover_image_url, duration_label, episode_date, is_featured"
      )
      .eq("is_active", true)
      .order("display_order")
      .limit(4)
      .then(({ data }) => {
        const rows = (data as Episode[]) || [];

        setEpisodes(rows);

        const featured = rows[0];

        if (featured) {
          setCurrentId(featured.id);
        }
      });
  }, []);

  const current = useMemo(
    () =>
      episodes.find(
        (episode) => episode.id === currentId
      ) || null,
    [episodes, currentId]
  );

  useEffect(() => {
  setProgress(0);
  setPlaying(false);
}, [currentId]);

useEffect(() => {
  if (audioRef.current) {
    audioRef.current.playbackRate = playbackRate;
  }
}, [playbackRate, currentId]);

  const toggle = async (id: string) => {
    if (id !== currentId) {
      setCurrentId(id);

      setTimeout(() => {
        const el = audioRef.current;

        if (!el) return;

        el.play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      }, 60);

      return;
    }

    const el = audioRef.current;

    if (!el) return;

    if (el.paused) {
      try {
        await el.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  if (!episodes.length) return null;

  return (
    <section id="masmoo3" className="audio-section">
      <div className="container mx-auto px-6">

        <Reveal variant="clip">
          <div className="audio-section__heading">
            <h2 className="editorial-heading ">مسموع</h2>
            <p>للأذن حصتها من المُنحنى</p>
          </div>
        </Reveal>

        <Reveal variant="clip">
          <div className="audio-panel">

            {current && (
              <div
                key={current.id}
                className={`audio-player ${
                  playing ? "is-playing" : ""
                }`}
              >

                {current.cover_image_url && (
                  <div className="audio-player__cover">
                    <img
                      src={current.cover_image_url}
                      alt={current.title}
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="audio-player__body">

                  <span className="audio-chip">
                    {current.category || "حكاية رقم"}
                  </span>

                  <h3 className="audio-player__title">
                    {current.title}
                  </h3>

                  {current.description && (
                    <p className="audio-player__text">
                      {current.description}
                    </p>
                  )}

                  <div className="audio-controls">

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="audio-play"
                      onClick={() => toggle(current.id)}
                      aria-label={
                        playing ? "إيقاف" : "تشغيل"
                      }
                    >
                      {playing ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>

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
    align="center"
    side="top"
    sideOffset={10}
    className="audio-speed-menu"
  >
    <div className="audio-speed-menu__title">
      سرعة التشغيل
    </div>

    <div className="audio-speed-options">
      {[0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
        <button
          key={speed}
          type="button"
          className={`audio-speed-option ${
            playbackRate === speed ? "is-active" : ""
          }`}
          onClick={() => {
            setPlaybackRate(speed);

            if (audioRef.current) {
              audioRef.current.playbackRate = speed;
            }
          }}
        >
          {speed}×
        </button>
      ))}
    </div>
  </PopoverContent>
</Popover>
                    
                    <div
                      className={`audio-waveform ${
                        playing ? "is-playing" : ""
                      }`}
                      aria-hidden="true"
                    >
                      {Array.from(
                        { length: 30 },
                        (_, index) => (
                          <span
                            key={index}
                            className={
                              (index / 29) * 100 <= progress
                                ? "is-played"
                                : ""
                            }
                          />
                        )
                      )}
                    </div>

                    <span className="audio-duration">
                      {current.duration_label || ""}
                    </span>

                  </div>

                  <audio
                    ref={audioRef}
                    src={current.audio_url}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onTimeUpdate={(e) => {
                      const el = e.currentTarget;

                      if (
                        Number.isFinite(el.duration) &&
                        el.duration > 0
                      ) {
                        setProgress(
                          (el.currentTime / el.duration) * 100
                        );
                      }
                    }}
                    onEnded={() => {
                      setPlaying(false);
                      setProgress(0);
                    }}
                    className="hidden"
                  />

                </div>
              </div>
            )}

            <div className="audio-more">

              <h3>اسمع أكثر</h3>

              <ul className="audio-list">

                {episodes.map((ep) => (
                  <li key={ep.id}>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggle(ep.id)}
                      className={`audio-item ${
                        ep.id === currentId
                          ? "is-active"
                          : ""
                      }`}
                    >

                      <span className="audio-item__icon">
                        {ep.id === currentId && playing ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </span>

                      <span className="audio-item__body">

                        <span className="audio-item__title">
                          {ep.title}
                        </span>

                        <span className="audio-item__meta">
                          {ep.category && (
                            <span>{ep.category}</span>
                          )}

                          {ep.duration_label && (
                            <span>
                              {ep.duration_label}
                            </span>
                          )}
                        </span>

                      </span>

                    </Button>

                  </li>
                ))}

              </ul>

              <Link to="/audio" className="audio-all editorial-link">
                <Headphones className="w-4 h-4" />
                كل الحلقات
              </Link>

            </div>

          </div>
        </Reveal>

      </div>
    </section>
  );
};

export default AudioSection;
