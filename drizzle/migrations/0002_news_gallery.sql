ALTER TABLE public.news ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS gallery_title text;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS gallery_pdf_url text;