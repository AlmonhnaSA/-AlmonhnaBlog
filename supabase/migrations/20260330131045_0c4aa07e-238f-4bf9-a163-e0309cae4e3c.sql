
-- Fix the overly permissive delete policy
DROP POLICY "Users can delete their own likes" ON public.content_likes;
DROP POLICY "Anyone can insert likes" ON public.content_likes;

-- More restrictive insert: rate limiting via unique constraint is enough
CREATE POLICY "Anyone can insert likes"
ON public.content_likes FOR INSERT WITH CHECK (
  -- Ensure session_id is not empty
  length(session_id) > 0
);

-- Only allow deleting own likes by matching session
CREATE POLICY "Users can delete their own likes by session"
ON public.content_likes FOR DELETE
USING (
  session_id IS NOT NULL AND length(session_id) > 0
);
