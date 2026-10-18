-- STAGED ONLY. Do not apply to Cloud or production without separate approval.
-- Reviewed against BOTH migration trees; verify the independent schema first.
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  bucket text NOT NULL,
  object_key text NOT NULL,
  bytes bigint NOT NULL,
  mime text NOT NULL,
  state text NOT NULL DEFAULT 'uploading',
  lease_until timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bucket, object_key)
);
GRANT SELECT ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_assets_read_owner ON public.media_assets FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.media_references (
  asset_id uuid NOT NULL REFERENCES public.media_assets(id),
  source_table text NOT NULL,
  source_id text NOT NULL,
  PRIMARY KEY(asset_id, source_table, source_id)
);
GRANT ALL ON public.media_references TO service_role;
ALTER TABLE public.media_references ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.media_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.media_assets(id),
  status text NOT NULL DEFAULT 'preview',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.media_jobs TO service_role;
ALTER TABLE public.media_jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.media_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  operation text NOT NULL,
  asset_id uuid,
  outcome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_audit TO authenticated;
GRANT ALL ON public.media_audit TO service_role;
ALTER TABLE public.media_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_audit_admin_read ON public.media_audit FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Unknown/encoded references MUST fail closed. This initial fence deliberately
-- blocks physical deletion globally; no configuration column can enable it.
-- All public-table writes are serialized against future deletion using the
-- same advisory lock. No provider deletion occurs inside a DB transaction.
CREATE OR REPLACE FUNCTION public.media_reference_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE old_id text; new_id text; payload text; a record;
BEGIN
  PERFORM pg_advisory_xact_lock(771829461);
  IF TG_OP <> 'INSERT' THEN
    old_id := to_jsonb(OLD)->>'id';
    DELETE FROM public.media_references WHERE source_table = TG_TABLE_NAME AND source_id = old_id;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_id := to_jsonb(NEW)->>'id';
    payload := to_jsonb(NEW)::text;
    -- Conservative raw-path matching also protects foreign-host/shared paths.
    -- Encoded legacy references are reviewed by the full read-only scanner.
    FOR a IN SELECT * FROM public.media_assets ORDER BY id FOR UPDATE LOOP
      IF strpos(payload, a.object_key) > 0 THEN
        IF a.state IN ('deleting', 'deleted') THEN RAISE EXCEPTION 'media_unavailable'; END IF;
        INSERT INTO public.media_references(asset_id, source_table, source_id)
        VALUES (a.id, TG_TABLE_NAME, new_id) ON CONFLICT DO NOTHING;
        UPDATE public.media_assets SET state = 'ready', lease_until = now() WHERE id = a.id;
      END IF;
    END LOOP;
  END IF;
  INSERT INTO public.media_jobs(asset_id)
    SELECT id FROM public.media_assets a WHERE NOT EXISTS(SELECT 1 FROM public.media_references r WHERE r.asset_id = a.id)
    AND NOT EXISTS(SELECT 1 FROM public.media_jobs j WHERE j.asset_id = a.id AND j.status = 'preview');
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.media_reference_guard() FROM PUBLIC, anon, authenticated;

DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    AND tablename NOT LIKE 'media_%'
    AND EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = tablename AND c.column_name = 'id')
  LOOP
    EXECUTE format('CREATE TRIGGER media_reference_guard AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.media_reference_guard()', t.tablename);
  END LOOP;
END $$;

-- Caller-scoped RLS remains authoritative. Narrow whitelist, typed JSON
-- population and identifier quoting; no arbitrary SQL accepted from clients.
CREATE OR REPLACE FUNCTION public.media_save(
 p_table text, p_id uuid, p_values jsonb, p_children jsonb DEFAULT '{}'::jsonb,
 p_expected_updated_at timestamptz DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE result jsonb; current_row jsonb; cols text; vals text; child text; child_rows jsonb; row_value jsonb; fk text; attrs text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_table NOT IN ('articles','news','products','store_products','profiles','timelines','audio_episodes') THEN RAISE EXCEPTION 'unsupported_table'; END IF;
  IF p_values IS NULL OR jsonb_typeof(p_values) <> 'object' THEN RAISE EXCEPTION 'invalid_values'; END IF;
  PERFORM pg_advisory_xact_lock(771829461);
  IF p_id IS NOT NULL THEN
    EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE', p_table) INTO current_row USING p_id;
    IF current_row IS NULL THEN RAISE EXCEPTION 'not_found_or_forbidden'; END IF;
    IF p_expected_updated_at IS NULL OR (current_row->>'updated_at')::timestamptz IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'revision_conflict'; END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_values) k WHERE k IN ('id','user_id','created_at','updated_at','approved_at')) THEN RAISE EXCEPTION 'protected_field'; END IF;
  IF NOT public.has_role(auth.uid(), 'admin') AND p_table IN ('articles','news') THEN
    IF p_values->>'status' IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'writer_status_required'; END IF;
  END IF;
  SELECT string_agg(format('%I', k), ',') INTO cols FROM jsonb_object_keys(p_values) k;
  IF cols IS NULL THEN RAISE EXCEPTION 'empty_values'; END IF;
  IF p_id IS NULL THEN
    EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) RETURNING to_jsonb(%I.*)',p_table,cols,cols,p_table,p_table) INTO result USING p_values;
  ELSE
    SELECT string_agg(format('%I = v.%I', k, k), ',') INTO vals FROM jsonb_object_keys(p_values) k;
    EXECUTE format('UPDATE public.%I t SET %s FROM jsonb_populate_record(NULL::public.%I,$1) v WHERE t.id=$2 RETURNING to_jsonb(t)',p_table,vals,p_table) INTO result USING p_values,p_id;
  END IF;
  IF result IS NULL THEN RAISE EXCEPTION 'not_found_or_forbidden'; END IF;
  p_id := (result->>'id')::uuid;
  FOR child, child_rows IN SELECT * FROM jsonb_each(p_children) LOOP
    IF NOT ((p_table='store_products' AND child IN ('store_product_images','store_product_files')) OR (p_table='timelines' AND child='timeline_stops') OR (p_table='articles' AND child IN ('article_categories','article_knowledge_links','article_continuations'))) THEN RAISE EXCEPTION 'unsupported_child'; END IF;
    fk := CASE WHEN p_table='store_products' THEN 'store_product_id' WHEN p_table='timelines' THEN 'timeline_id' ELSE 'article_id' END;
    IF jsonb_typeof(child_rows) <> 'array' THEN RAISE EXCEPTION 'invalid_children'; END IF;
    EXECUTE format('DELETE FROM public.%I WHERE %I=$1',child,fk) USING p_id;
    FOR row_value IN SELECT value FROM jsonb_array_elements(child_rows) LOOP
      row_value := (row_value - 'id' - 'created_at' - 'updated_at') || jsonb_build_object(fk,p_id);
      SELECT string_agg(format('%I', k), ',') INTO attrs FROM jsonb_object_keys(row_value) k;
      EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1)',child,attrs,attrs,child) USING row_value;
    END LOOP;
  END LOOP;
  RETURN result;
END $$;
-- Audit commits are recorded by the privileged reference trigger, not a client.
GRANT EXECUTE ON FUNCTION public.media_save(text,uuid,jsonb,jsonb,timestamptz) TO authenticated;
REVOKE ALL ON FUNCTION public.media_save(text,uuid,jsonb,jsonb,timestamptz) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.media_delete(p_table text, p_id uuid, p_expected_updated_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE result jsonb; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
 IF p_table NOT IN ('articles','news','products','store_products','timelines') THEN RAISE EXCEPTION 'unsupported_table'; END IF;
 PERFORM pg_advisory_xact_lock(771829461);
 EXECUTE format('DELETE FROM public.%I WHERE id=$1 AND updated_at=$2 RETURNING to_jsonb(%I.*)',p_table,p_table) INTO result USING p_id,p_expected_updated_at;
 IF result IS NULL THEN RAISE EXCEPTION 'not_found_forbidden_or_conflict'; END IF;
 RETURN jsonb_build_object('id',result->>'id','deleted',true);
END $$;
REVOKE ALL ON FUNCTION public.media_delete(text,uuid,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.media_delete(text,uuid,timestamptz) TO authenticated;

-- Account removal stays disabled: the existing profile DELETE policy is absent
-- in the audited schema. Do not bypass it or change account semantics here.
-- Physical deletion also stays disabled pending complete encoded-reference
-- fencing, independent backfill, protection-list review and separate approval.