-- STAGED ONLY. Review ALL existing Storage policies on the independent clone.
-- Service-role server remains authorized; clients cannot overwrite/delete images.
CREATE POLICY media_no_client_delete ON storage.objects AS RESTRICTIVE
FOR DELETE TO authenticated USING (bucket_id NOT IN ('images','store-files'));
CREATE POLICY media_no_client_overwrite ON storage.objects AS RESTRICTIVE
FOR UPDATE TO authenticated USING (bucket_id NOT IN ('images','store-files'))
WITH CHECK (bucket_id NOT IN ('images','store-files'));

CREATE OR REPLACE FUNCTION public.media_client_key_available(p_bucket text,p_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT NOT EXISTS(SELECT 1 FROM media_assets WHERE bucket=p_bucket AND object_key=p_key)
$$;
REVOKE ALL ON FUNCTION public.media_client_key_available(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.media_client_key_available(text,text) TO authenticated;
CREATE POLICY media_no_client_key_reuse ON storage.objects AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (
  bucket_id NOT IN ('images','store-files') OR public.media_client_key_available(bucket_id,name)
);
-- Also review anon/granted service clients, signed-upload token lifetimes,
-- move/copy APIs and any custom server functions before approving this release.