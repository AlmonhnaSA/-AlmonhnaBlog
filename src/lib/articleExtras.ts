/** Shared helpers for the optional editorial fields added to articles. */

export interface SequencePoint {
  title: string;
}

/** Older articles have no sequence_points — always fall back to an empty list. */
export const parseSequencePoints = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return (value as any[])
    .map((item) => (typeof item === "string" ? item : item?.title))
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim());
};

export const KNOWLEDGE_LINK_ATTR = "data-knowledge-link";

/** Stable, readable anchor key for a knowledge link block. */
export const makeAnchorKey = () =>
  `kl-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

/** Rough Arabic reading time, ~180 words per minute. */
export const readingTimeMinutes = (html: string) => {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 1;
  return Math.max(1, Math.round(text.split(" ").length / 180));
};
