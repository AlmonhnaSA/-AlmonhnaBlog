import { Minus, Plus, RotateCcw, ALargeSmall, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIN = 14;
const MAX = 32;
const DEFAULT = 17;

export type ReadingBackground =
  | "paper"
  | "ivory"
  | "sage"
  | "mist";

const READING_BACKGROUNDS: {
  value: ReadingBackground;
  label: string;
}[] = [
  { value: "paper", label: "افتراضي" },
  { value: "ivory", label: "عاجي" },
  { value: "sage", label: "أخضر هادئ" },
  { value: "mist", label: "ضبابي" },
];

interface TextZoomControlProps {
  value: number;
  onChange: (next: number) => void;
  background?: ReadingBackground;
  onBackgroundChange?: (next: ReadingBackground) => void;
  className?: string;
}

export const TextZoomControl = ({
  value,
  onChange,
  background = "paper",
  onBackgroundChange,
  className,
}: TextZoomControlProps) => {
  const clamp = (n: number) =>
    Math.min(MAX, Math.max(MIN, n));

  return (
    <div
      className={`reading-controls inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-1 ${
        className || ""
      }`}
    >
      <ALargeSmall className="w-4 h-4 text-muted-foreground" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="تصغير النص"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= MIN}
      >
        <Minus className="w-4 h-4" />
      </Button>

      <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
        {value}px
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="تكبير النص"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= MAX}
      >
        <Plus className="w-4 h-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="إعادة حجم النص"
        onClick={() => onChange(DEFAULT)}
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </Button>

      {onBackgroundChange && (
        <>
          <span
            className="mx-1 h-5 w-px bg-border"
            aria-hidden="true"
          />

          <Palette
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />

          <div
            className="flex items-center gap-1"
            aria-label="لون خلفية القراءة"
          >
            {READING_BACKGROUNDS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                size="icon"
                className={`reading-swatch reading-swatch-${option.value} h-7 w-7 rounded-full ${
                  background === option.value ? "is-active" : ""
                }`}
                aria-label={`خلفية ${option.label}`}
                aria-pressed={background === option.value}
                title={`خلفية ${option.label}`}
                onClick={() =>
                  onBackgroundChange(option.value)
                }
              >
                <span className="sr-only">
                  {option.label}
                </span>
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const DEFAULT_ARTICLE_FONT_SIZE = DEFAULT;
