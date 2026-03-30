import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "almonhna_session_id";

const getSessionId = (): string => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

export const useLikes = (contentId: string, contentType: "article" | "news") => {
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionId = getSessionId();

  useEffect(() => {
    const fetchLikes = async () => {
      const { count } = await supabase
        .from("content_likes")
        .select("*", { count: "exact", head: true })
        .eq("content_id", contentId)
        .eq("content_type", contentType);
      setLikeCount(count || 0);

      const { data } = await supabase
        .from("content_likes")
        .select("id")
        .eq("content_id", contentId)
        .eq("session_id", sessionId)
        .maybeSingle();
      setIsLiked(!!data);
    };
    fetchLikes();
  }, [contentId, contentType, sessionId]);

  const toggleLike = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isLiked) {
        await supabase
          .from("content_likes")
          .delete()
          .eq("content_id", contentId)
          .eq("session_id", sessionId);
        setIsLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("content_likes").insert({
          content_id: contentId,
          content_type: contentType,
          session_id: sessionId,
          user_id: user?.id || null,
        });
        setIsLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (e) {
      console.error("Like error:", e);
    } finally {
      setLoading(false);
    }
  }, [isLiked, loading, contentId, contentType, sessionId]);

  return { likeCount, isLiked, toggleLike, loading };
};
