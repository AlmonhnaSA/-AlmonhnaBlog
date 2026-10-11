CREATE TABLE public.quote_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quote_text text NOT NULL,
  article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL,
  article_title text,
  writer_name text NOT NULL,
  x_handle text,
  linkedin_handle text,
  color text NOT NULL DEFAULT '#00343A',
  size text NOT NULL DEFAULT 'square',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_cards TO authenticated;
GRANT ALL ON public.quote_cards TO service_role;

ALTER TABLE public.quote_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Writers manage own quote cards"
ON public.quote_cards FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all quote cards"
ON public.quote_cards FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete quote cards"
ON public.quote_cards FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_quote_cards_updated_at
BEFORE UPDATE ON public.quote_cards
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();