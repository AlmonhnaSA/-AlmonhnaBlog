
-- Create content_likes table for tracking likes on articles and news
CREATE TABLE public.content_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'news')),
  session_id TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, session_id)
);

-- Enable RLS
ALTER TABLE public.content_likes ENABLE ROW LEVEL SECURITY;

-- Everyone can view likes (for counting)
CREATE POLICY "Likes viewable by everyone"
ON public.content_likes FOR SELECT USING (true);

-- Everyone can insert likes (guests too)
CREATE POLICY "Anyone can insert likes"
ON public.content_likes FOR INSERT WITH CHECK (true);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
ON public.content_likes FOR DELETE
USING (session_id = session_id);

-- Index for fast counting
CREATE INDEX idx_content_likes_content ON public.content_likes(content_id, content_type);
CREATE INDEX idx_content_likes_author ON public.content_likes(content_id);
