-- 1) CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2) ARTICLE <-> CATEGORY
CREATE TABLE public.article_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, category_id)
);
GRANT SELECT ON public.article_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_categories TO authenticated;
GRANT ALL ON public.article_categories TO service_role;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Article categories viewable by everyone" ON public.article_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage article categories" ON public.article_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Writers manage own article categories" ON public.article_categories FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.articles a JOIN public.profiles p ON p.id = a.author_id WHERE a.id = article_categories.article_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.articles a JOIN public.profiles p ON p.id = a.author_id WHERE a.id = article_categories.article_id AND p.user_id = auth.uid()));

-- 3) ARTICLE SEQUENCE (optional, on article)
ALTER TABLE public.articles ADD COLUMN sequence_points jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 4) KNOWLEDGE LINKS
CREATE TABLE public.article_knowledge_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  target_article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  question text NOT NULL,
  anchor_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.article_knowledge_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_knowledge_links TO authenticated;
GRANT ALL ON public.article_knowledge_links TO service_role;
ALTER TABLE public.article_knowledge_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Knowledge links viewable by everyone" ON public.article_knowledge_links FOR SELECT USING (true);
CREATE POLICY "Admins manage knowledge links" ON public.article_knowledge_links FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Writers manage own knowledge links" ON public.article_knowledge_links FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.articles a JOIN public.profiles p ON p.id = a.author_id WHERE a.id = article_knowledge_links.article_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.articles a JOIN public.profiles p ON p.id = a.author_id WHERE a.id = article_knowledge_links.article_id AND p.user_id = auth.uid()));
CREATE TRIGGER update_knowledge_links_updated_at BEFORE UPDATE ON public.article_knowledge_links FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5) CONTINUATIONS ("الحكاية لم تنتهِ بعد")
CREATE TABLE public.article_continuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  target_article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, target_article_id)
);
GRANT SELECT ON public.article_continuations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_continuations TO authenticated;
GRANT ALL ON public.article_continuations TO service_role;
ALTER TABLE public.article_continuations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Continuations viewable by everyone" ON public.article_continuations FOR SELECT USING (true);
CREATE POLICY "Admins manage continuations" ON public.article_continuations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Writers manage own continuations" ON public.article_continuations FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.articles a JOIN public.profiles p ON p.id = a.author_id WHERE a.id = article_continuations.article_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.articles a JOIN public.profiles p ON p.id = a.author_id WHERE a.id = article_continuations.article_id AND p.user_id = auth.uid()));

-- 6) STORY OF THE DAY
CREATE TABLE public.daily_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  badge text,
  stops jsonb NOT NULL DEFAULT '[]'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_stories TO authenticated;
GRANT ALL ON public.daily_stories TO service_role;
ALTER TABLE public.daily_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Daily stories viewable by everyone" ON public.daily_stories FOR SELECT USING (true);
CREATE POLICY "Admins manage daily stories" ON public.daily_stories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE TRIGGER update_daily_stories_updated_at BEFORE UPDATE ON public.daily_stories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7) TIMELINES ("خطوط المُنحنى")
CREATE TABLE public.timelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  timeline_type text NOT NULL DEFAULT 'interactive',
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.timelines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timelines TO authenticated;
GRANT ALL ON public.timelines TO service_role;
ALTER TABLE public.timelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Timelines viewable by everyone" ON public.timelines FOR SELECT USING (true);
CREATE POLICY "Admins manage timelines" ON public.timelines FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE TRIGGER update_timelines_updated_at BEFORE UPDATE ON public.timelines FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.timeline_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id uuid NOT NULL REFERENCES public.timelines(id) ON DELETE CASCADE,
  label text,
  title text NOT NULL,
  description text,
  image_url text,
  article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.timeline_stops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_stops TO authenticated;
GRANT ALL ON public.timeline_stops TO service_role;
ALTER TABLE public.timeline_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Timeline stops viewable by everyone" ON public.timeline_stops FOR SELECT USING (true);
CREATE POLICY "Admins manage timeline stops" ON public.timeline_stops FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE TRIGGER update_timeline_stops_updated_at BEFORE UPDATE ON public.timeline_stops FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8) AUDIENCE QUESTIONS
CREATE TABLE public.audience_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  question text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  linked_article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audience_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audience_questions TO authenticated;
GRANT ALL ON public.audience_questions TO service_role;
ALTER TABLE public.audience_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a question" ON public.audience_questions FOR INSERT WITH CHECK (length(question) > 0 AND status = 'new' AND linked_article_id IS NULL);
CREATE POLICY "Published question-to-article pairs are public" ON public.audience_questions FOR SELECT USING (
  linked_article_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.articles a WHERE a.id = audience_questions.linked_article_id AND a.status = 'approved'::content_status)
);
CREATE POLICY "Admins manage audience questions" ON public.audience_questions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE TRIGGER update_audience_questions_updated_at BEFORE UPDATE ON public.audience_questions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_article_categories_article ON public.article_categories(article_id);
CREATE INDEX idx_article_categories_category ON public.article_categories(category_id);
CREATE INDEX idx_knowledge_links_article ON public.article_knowledge_links(article_id);
CREATE INDEX idx_continuations_article ON public.article_continuations(article_id);
CREATE INDEX idx_timeline_stops_timeline ON public.timeline_stops(timeline_id);