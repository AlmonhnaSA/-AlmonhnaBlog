
-- Store products table
CREATE TABLE public.store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  required_articles_count INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store product sub-images
CREATE TABLE public.store_product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_product_id UUID NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store product files
CREATE TABLE public.store_product_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_product_id UUID NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_product_files ENABLE ROW LEVEL SECURITY;

-- Store products: everyone can view, admins can manage
CREATE POLICY "Store products viewable by everyone" ON public.store_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage store products" ON public.store_products FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Store product images: everyone can view, admins can manage
CREATE POLICY "Store product images viewable by everyone" ON public.store_product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage store product images" ON public.store_product_images FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Store product files: everyone can view metadata, admins can manage
CREATE POLICY "Store product files viewable by everyone" ON public.store_product_files FOR SELECT USING (true);
CREATE POLICY "Admins can manage store product files" ON public.store_product_files FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Updated at trigger for store_products
CREATE TRIGGER handle_store_products_updated_at
  BEFORE UPDATE ON public.store_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket for store files
INSERT INTO storage.buckets (id, name, public) VALUES ('store-files', 'store-files', true);

-- Storage policies for store-files bucket
CREATE POLICY "Anyone can view store files" ON storage.objects FOR SELECT USING (bucket_id = 'store-files');
CREATE POLICY "Admins can upload store files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-files' AND has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can delete store files" ON storage.objects FOR DELETE USING (bucket_id = 'store-files' AND has_role(auth.uid(), 'admin'::user_role));
