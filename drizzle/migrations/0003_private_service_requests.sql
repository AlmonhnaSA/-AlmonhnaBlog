CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_key uuid NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  contact text NOT NULL CHECK (char_length(btrim(contact)) BETWEEN 5 AND 255),
  service text NOT NULL CHECK (service IN ('صياغة المحتوى الاقتصادي', 'إعداد المحتوى الاقتصادي', 'التعليق الصوتي')),
  details text NOT NULL CHECK (char_length(btrim(details)) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'rejected')),
  notification_status text NOT NULL DEFAULT 'pending' CHECK (notification_status IN ('pending', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_requests TO authenticated;
GRANT UPDATE (status) ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administrators read service requests" ON public.service_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Administrators update service request status" ON public.service_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX service_requests_created_at_idx ON public.service_requests (created_at DESC);
CREATE TRIGGER service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TABLE public.service_request_rate_limits (
  key_hash text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1
);
GRANT ALL ON public.service_request_rate_limits TO service_role;
ALTER TABLE public.service_request_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.consume_service_request_limit(p_key_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE allowed boolean;
BEGIN
  INSERT INTO public.service_request_rate_limits AS limits (key_hash, window_start, attempts)
  VALUES (p_key_hash, now(), 1)
  ON CONFLICT (key_hash) DO UPDATE SET
    window_start = CASE WHEN limits.window_start < now() - interval '15 minutes' THEN now() ELSE limits.window_start END,
    attempts = CASE WHEN limits.window_start < now() - interval '15 minutes' THEN 1 ELSE limits.attempts + 1 END
  RETURNING attempts <= 5 INTO allowed;
  RETURN allowed;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_service_request_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_service_request_limit(text) TO service_role;