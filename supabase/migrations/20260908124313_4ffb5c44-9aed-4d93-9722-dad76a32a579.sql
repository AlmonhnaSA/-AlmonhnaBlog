GRANT SELECT ON public.articles, public.news, public.profiles, public.categories, public.article_categories, public.article_continuations, public.article_knowledge_links, public.daily_stories, public.timelines, public.timeline_stops, public.audience_questions, public.products, public.store_products, public.store_product_images, public.store_product_files, public.content_likes TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.articles, public.news, public.profiles, public.categories, public.article_categories, public.article_continuations, public.article_knowledge_links, public.daily_stories, public.timelines, public.timeline_stops, public.audience_questions, public.products, public.store_products, public.store_product_images, public.store_product_files, public.content_likes, public.product_requests TO authenticated;

GRANT INSERT ON public.audience_questions, public.content_likes TO anon;
GRANT DELETE ON public.content_likes TO anon;

GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT SELECT ON public.product_requests TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;