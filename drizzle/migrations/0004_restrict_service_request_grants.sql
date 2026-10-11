REVOKE ALL ON public.service_requests FROM anon, authenticated;
GRANT SELECT ON public.service_requests TO authenticated;
GRANT UPDATE (status) ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
REVOKE ALL ON public.service_request_rate_limits FROM anon, authenticated;
GRANT ALL ON public.service_request_rate_limits TO service_role;