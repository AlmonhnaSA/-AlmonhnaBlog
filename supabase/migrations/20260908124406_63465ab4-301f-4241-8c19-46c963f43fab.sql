DROP POLICY "Admins can manage all articles" ON public.articles;
CREATE POLICY "Admins can manage all articles" ON public.articles FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::user_role)) WITH CHECK (has_role(auth.uid(),'admin'::user_role));

DROP POLICY "Admins can manage all news" ON public.news;
CREATE POLICY "Admins can manage all news" ON public.news FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::user_role)) WITH CHECK (has_role(auth.uid(),'admin'::user_role));

DROP POLICY "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::user_role)) WITH CHECK (has_role(auth.uid(),'admin'::user_role));

DROP POLICY "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::user_role)) WITH CHECK (has_role(auth.uid(),'admin'::user_role));

DROP POLICY "Admins can manage store product files" ON public.store_product_files;
CREATE POLICY "Admins can manage store product files" ON public.store_product_files FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::user_role)) WITH CHECK (has_role(auth.uid(),'admin'::user_role));

DROP POLICY "Admins can manage store product images" ON public.store_product_images;
CREATE POLICY "Admins can manage store product images" ON public.store_product_images FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::user_role)) WITH CHECK (has_role(auth.uid(),'admin'::user_role));

DROP POLICY "Admins can manage store products" ON public.store_products;
CREATE POLICY "Admins can manage store products" ON public.store_products FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::user_role)) WITH CHECK (has_role(auth.uid(),'admin'::user_role));

DROP POLICY "Admins can insert user roles" ON public.user_roles;
CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::user_role));

DROP POLICY "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::user_role));

DROP POLICY "Admins can delete user roles" ON public.user_roles;
CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::user_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) FROM anon, public;