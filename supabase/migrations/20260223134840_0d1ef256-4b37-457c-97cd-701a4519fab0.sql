
CREATE POLICY "Writers can delete their own articles"
ON public.articles
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = articles.author_id AND profiles.user_id = auth.uid()
));

CREATE POLICY "Writers can delete their own news"
ON public.news
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = news.author_id AND profiles.user_id = auth.uid()
));
