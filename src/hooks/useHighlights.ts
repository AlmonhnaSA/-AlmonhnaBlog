import { useState, useEffect, useCallback } from "react";

export interface HighlightItem {
  id: string;
  text: string;
  contentId: string;
  contentType: "article" | "news";
  createdAt: string;
}

const STORAGE_KEY = "almonhna_highlights";

const getHighlights = (): HighlightItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useHighlights = (contentId: string, contentType: "article" | "news") => {
  const [allHighlights, setAllHighlights] = useState<HighlightItem[]>(getHighlights);

  const highlights = allHighlights.filter(
    (h) => h.contentId === contentId && h.contentType === contentType
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allHighlights));
  }, [allHighlights]);

  const addHighlight = useCallback(
    (text: string) => {
      const exists = allHighlights.some(
        (h) => h.text === text && h.contentId === contentId
      );
      if (exists || text.trim().length < 5) return;
      setAllHighlights((prev) => [
        {
          id: crypto.randomUUID(),
          text: text.trim(),
          contentId,
          contentType,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [allHighlights, contentId, contentType]
  );

  const removeHighlight = useCallback((id: string) => {
    setAllHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const isHighlighted = useCallback(
    (text: string) => highlights.some((h) => h.text === text),
    [highlights]
  );

  return { highlights, addHighlight, removeHighlight, isHighlighted };
};
