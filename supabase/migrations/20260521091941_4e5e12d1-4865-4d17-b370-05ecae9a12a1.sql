-- Add approved_at column to articles table
ALTER TABLE public.articles ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Add approved_at column to news table
ALTER TABLE public.news ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Update existing approved articles to set approved_at = updated_at
UPDATE public.articles SET approved_at = updated_at WHERE status = 'approved' AND approved_at IS NULL;
UPDATE public.news SET approved_at = updated_at WHERE status = 'approved' AND approved_at IS NULL;

-- Create function to auto-set approved_at when status changes to approved
CREATE OR REPLACE FUNCTION public.handle_approved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status != 'approved' OR OLD.approved_at IS NULL) THEN
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for articles
CREATE TRIGGER set_articles_approved_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.handle_approved_at();

-- Create trigger for news
CREATE TRIGGER set_news_approved_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.handle_approved_at();