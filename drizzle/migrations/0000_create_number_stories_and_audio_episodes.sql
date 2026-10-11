CREATE TABLE public.number_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number_value TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  story_date DATE,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.number_stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.number_stories TO authenticated;
GRANT ALL ON public.number_stories TO service_role;

ALTER TABLE public.number_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active number stories"
ON public.number_stories FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage number stories insert"
ON public.number_stories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage number stories update"
ON public.number_stories FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage number stories delete"
ON public.number_stories FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER number_stories_updated_at
BEFORE UPDATE ON public.number_stories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.audio_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  duration_label TEXT,
  episode_date DATE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audio_episodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audio_episodes TO authenticated;
GRANT ALL ON public.audio_episodes TO service_role;

ALTER TABLE public.audio_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active audio episodes"
ON public.audio_episodes FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage audio episodes insert"
ON public.audio_episodes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage audio episodes update"
ON public.audio_episodes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage audio episodes delete"
ON public.audio_episodes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER audio_episodes_updated_at
BEFORE UPDATE ON public.audio_episodes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();