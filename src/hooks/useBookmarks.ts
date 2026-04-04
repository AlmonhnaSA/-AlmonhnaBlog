import { useState, useEffect, useCallback } from "react";

export interface BookmarkItem {
  id: string;
  type: "article" | "news";
  title: string;
  excerpt: string;
  coverImage: string;
  authorName: string;
  savedAt: string;
}

const STORAGE_KEY = "almonhna_bookmarks";

const getBookmarks = (): BookmarkItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(getBookmarks);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, "savedAt">) => {
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.id === item.id);
        if (exists) return prev.filter((b) => b.id !== item.id);
        return [{ ...item, savedAt: new Date().toISOString() }, ...prev];
      });
    },
    []
  );

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark };
};
