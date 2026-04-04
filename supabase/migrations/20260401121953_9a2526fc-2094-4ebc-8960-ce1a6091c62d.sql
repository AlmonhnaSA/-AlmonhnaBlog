
-- Add product_type to store_products
ALTER TABLE public.store_products ADD COLUMN product_type text NOT NULL DEFAULT 'digital';

-- Create product_requests table
CREATE TABLE public.product_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_product_id uuid NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

-- Writers can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.product_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Writers can insert their own requests
CREATE POLICY "Users can insert their own requests"
ON public.product_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all requests"
ON public.product_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));
