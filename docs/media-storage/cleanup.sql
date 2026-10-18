-- STAGED ONLY; apply AFTER prepare.sql to an isolated independent-backend clone.
-- No storage bytes are deleted by SQL. Deployment and deletion require approval.
ALTER TABLE public.media_assets ADD COLUMN provider text NOT NULL DEFAULT 'supabase';
ALTER TABLE public.media_assets ADD COLUMN deletion_reviewed boolean NOT NULL DEFAULT false;
ALTER TABLE public.media_assets ADD COLUMN deletion_token uuid;
ALTER TABLE public.media_assets ADD COLUMN worker_until timestamptz;
ALTER TABLE public.media_assets ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.media_assets ADD CONSTRAINT media_asset_state CHECK(state IN ('uploading','ready','deleting','deleted'));
ALTER TABLE public.media_jobs ADD COLUMN operation_txid text;
ALTER TABLE public.media_jobs ADD COLUMN actor_id uuid;
ALTER TABLE public.media_jobs ADD COLUMN receipt uuid;

CREATE TABLE public.media_cleanup_release (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  project_host text NOT NULL,
  inventory_reviewed boolean NOT NULL DEFAULT false,
  backup_reviewed boolean NOT NULL DEFAULT false,
  external_reviewed boolean NOT NULL DEFAULT false,
  storage_policies_reviewed boolean NOT NULL DEFAULT false,
  protection_revision text NOT NULL,
  valid_until timestamptz NOT NULL
);
GRANT ALL ON public.media_cleanup_release TO service_role;
ALTER TABLE public.media_cleanup_release ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.media_protections (
  asset_id uuid PRIMARY KEY REFERENCES public.media_assets(id),
  reason text NOT NULL
);
GRANT ALL ON public.media_protections TO service_role;
ALTER TABLE public.media_protections ENABLE ROW LEVEL SECURITY;

-- Decode percent/JSON/HTML variants conservatively. Unsupported encodings block
-- the whole claim rather than silently losing a reference. Overmatching retains
-- extra files; it never authorizes deletion.
CREATE OR REPLACE FUNCTION public.media_normalize(p_text text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE v text := p_text; next_v text; m text[]; i int; j int; bytes bytea; code int;
BEGIN
  v := replace(v, E'\\/', '/');
  FOR i IN 1..4 LOOP
    next_v := v;
    FOR m IN SELECT regexp_matches(v, '\\u([0-9A-Fa-f]{4})', 'g') LOOP
      code := ('x' || m[1])::bit(16)::int;
      IF code = 0 OR code BETWEEN 55296 AND 57343 THEN RAISE EXCEPTION 'ambiguous_media_encoding'; END IF;
      next_v := replace(next_v, E'\\u' || m[1], chr(code));
    END LOOP;
    v := next_v;
    FOR m IN SELECT regexp_matches(v, '&#(x[0-9A-Fa-f]+|[0-9]+);', 'g') LOOP
      IF left(m[1],1) = 'x' THEN
        IF length(m[1]) > 7 THEN RAISE EXCEPTION 'ambiguous_media_encoding'; END IF;
        code := ('x' || lpad(substr(m[1],2),8,'0'))::bit(32)::int;
      ELSE code := m[1]::int; END IF;
      IF code <= 0 OR code > 1114111 OR code BETWEEN 55296 AND 57343 THEN RAISE EXCEPTION 'ambiguous_media_encoding'; END IF;
      v := replace(v, '&#' || m[1] || ';', chr(code));
    END LOOP;
    v := replace(replace(replace(v,'&amp;','&'),'&sol;','/'),'&percnt;','%');
    next_v := ''; j := 1;
    WHILE j <= length(v) LOOP
      IF substr(v,j,3) ~ '^%[0-9A-Fa-f]{2}$' THEN
        bytes := ''::bytea;
        WHILE substr(v,j,3) ~ '^%[0-9A-Fa-f]{2}$' LOOP
          bytes := bytes || decode(substr(v,j+1,2),'hex'); j := j+3;
        END LOOP;
        next_v := next_v || convert_from(bytes,'UTF8');
      ELSE next_v := next_v || substr(v,j,1); j := j+1; END IF;
    END LOOP;
    EXIT WHEN next_v = v;
    v := next_v;
  END LOOP;
  IF v ~ '%[0-9A-Fa-f]{2}|\\u[0-9A-Fa-f]{4}|&[A-Za-z]+;|&#' THEN RAISE EXCEPTION 'ambiguous_media_encoding'; END IF;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.media_normalize(text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.media_reference_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE detached uuid[]; a record; payload text; v_source_id text;
BEGIN
  PERFORM pg_advisory_xact_lock(771829461);
  IF TG_OP <> 'INSERT' THEN
    v_source_id := to_jsonb(OLD)->>'id';
    SELECT array_agg(asset_id) INTO detached FROM media_references WHERE source_table=TG_TABLE_NAME AND media_references.source_id=v_source_id;
    DELETE FROM media_references r WHERE r.source_table=TG_TABLE_NAME AND r.source_id=v_source_id;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    v_source_id := to_jsonb(NEW)->>'id';
    -- Fail closed for ambiguous writes only when a tombstone exists. During
    -- rollout ambiguous legacy text may save, but claims always fail closed.
    BEGIN payload := media_normalize(to_jsonb(NEW)::text);
    EXCEPTION WHEN OTHERS THEN
      IF EXISTS(SELECT 1 FROM media_assets WHERE state IN ('deleting','deleted')) THEN RAISE EXCEPTION 'ambiguous_media_encoding'; END IF;
      payload := to_jsonb(NEW)::text;
    END;
    FOR a IN SELECT * FROM media_assets ORDER BY id FOR UPDATE LOOP
      IF strpos(payload, media_normalize(a.object_key)) > 0 THEN
        IF a.state IN ('uploading','deleting','deleted') THEN RAISE EXCEPTION 'media_unavailable'; END IF;
        INSERT INTO media_references VALUES(a.id,TG_TABLE_NAME,v_source_id) ON CONFLICT DO NOTHING;
        UPDATE media_assets SET lease_until=now() WHERE id=a.id;
      END IF;
    END LOOP;
  END IF;
  -- Enqueue only references removed by THIS successful transaction; child
  -- replacement may reattach them before commit, so claim rechecks globally.
  INSERT INTO media_jobs(asset_id,operation_txid,actor_id)
    SELECT unnest(coalesce(detached,'{}'::uuid[])),txid_current()::text,auth.uid();
  INSERT INTO media_audit(actor_id,operation,outcome) VALUES(auth.uid(),TG_OP || ':' || TG_TABLE_NAME,'committed');
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

-- Never accept arbitrary IDs/keys from the browser. The receipt selects jobs
-- created by the caller's committed transaction, not an orphan inventory.
CREATE OR REPLACE FUNCTION public.media_cleanup_receipt(p_txid text,p_actor uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE token uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS(SELECT 1 FROM media_audit WHERE actor_id=p_actor AND operation LIKE 'readback:%' AND outcome=p_txid) THEN RAISE EXCEPTION 'save_not_verified'; END IF;
  UPDATE media_jobs SET receipt=token WHERE operation_txid=p_txid AND actor_id=p_actor AND receipt IS NULL;
  RETURN token;
END $$;
REVOKE ALL ON FUNCTION public.media_cleanup_receipt(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.media_cleanup_receipt(text,uuid) TO service_role;

-- Source coverage is checked on every claim. Missing/new/unfenced tables stop
-- deletion. Re-scan current rows including rejected/private/embedded content.
CREATE OR REPLACE FUNCTION public.media_cleanup_claim(p_receipt uuid,p_host text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; j record; t record; hits bigint; token uuid; payload record; normalized text;
BEGIN
  PERFORM pg_advisory_xact_lock(771829461);
  IF NOT EXISTS(SELECT 1 FROM media_cleanup_release WHERE project_host=p_host AND inventory_reviewed AND backup_reviewed AND external_reviewed AND storage_policies_reviewed AND valid_until>now()) THEN RETURN NULL; END IF;
  FOR t IN SELECT c.oid,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname NOT LIKE 'media_%' LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=t.oid AND tgfoid='public.media_reference_guard()'::regprocedure AND tgenabled='O') THEN RETURN NULL; END IF;
  END LOOP;
  FOR j IN SELECT * FROM media_jobs WHERE receipt=p_receipt AND status IN ('preview','retry','deleting') AND next_attempt_at<=now() ORDER BY created_at,id FOR UPDATE LOOP
    SELECT * INTO a FROM media_assets WHERE id=j.asset_id FOR UPDATE;
    IF a.state='deleted' THEN UPDATE media_jobs SET status='done' WHERE id=j.id; CONTINUE; END IF;
    IF a.state='deleting' AND a.worker_until>now() THEN CONTINUE; END IF;
    IF NOT a.deletion_reviewed OR a.provider <> 'supabase' OR a.bucket NOT IN ('images','store-files') OR a.mime NOT LIKE 'image/%' OR a.object_key ~* '(^|/)(audio|episodes)(/|$)|\.(mp3|m4a|aac|wav|ogg|opus|flac|aiff)$'
      OR a.lease_until>now() OR a.state NOT IN ('ready','deleting')
      OR EXISTS(SELECT 1 FROM media_protections WHERE asset_id=a.id) THEN CONTINUE; END IF;
    hits := 0;
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE 'media_%' LOOP
      FOR payload IN EXECUTE format('SELECT to_jsonb(t)::text AS text FROM public.%I t',t.tablename) LOOP
        BEGIN normalized := media_normalize(payload.text);
        EXCEPTION WHEN OTHERS THEN RETURN NULL; END;
        IF strpos(normalized,media_normalize(a.object_key))>0 THEN hits := hits+1; END IF;
      END LOOP;
    END LOOP;
    IF hits>0 OR EXISTS(SELECT 1 FROM media_references WHERE asset_id=a.id) THEN
      UPDATE media_jobs SET status='protected' WHERE id=j.id;
      INSERT INTO media_audit(asset_id,operation,outcome) VALUES(a.id,'cleanup','referenced');
      CONTINUE;
    END IF;
    token := coalesce(a.deletion_token,gen_random_uuid());
    UPDATE media_assets SET state='deleting',deletion_token=token,worker_until=now()+interval '5 minutes' WHERE id=a.id;
    UPDATE media_jobs SET status='deleting',attempts=attempts+1 WHERE id=j.id;
    INSERT INTO media_audit(asset_id,operation,outcome) VALUES(a.id,'cleanup','claimed');
    RETURN jsonb_build_object('asset_id',a.id,'token',token,'provider',a.provider,'bucket',a.bucket,'object_key',a.object_key);
  END LOOP;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.media_cleanup_claim(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.media_cleanup_claim(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.media_cleanup_finish(p_asset uuid,p_token uuid,p_success boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(771829461);
  IF NOT EXISTS(SELECT 1 FROM media_assets WHERE id=p_asset AND state='deleting' AND deletion_token=p_token FOR UPDATE) THEN RAISE EXCEPTION 'claim_conflict'; END IF;
  IF p_success THEN
    UPDATE media_assets SET state='deleted',worker_until=NULL WHERE id=p_asset;
    UPDATE media_jobs SET status='done' WHERE asset_id=p_asset;
  ELSE
    -- Keep tombstone: provider may have deleted bytes before timing out.
    UPDATE media_assets SET worker_until=now()+interval '1 minute' WHERE id=p_asset;
    UPDATE media_jobs SET status='retry',next_attempt_at=now()+interval '1 minute' WHERE asset_id=p_asset AND status='deleting';
  END IF;
  INSERT INTO media_audit(asset_id,operation,outcome) VALUES(p_asset,'cleanup',CASE WHEN p_success THEN 'deleted_verified' ELSE 'retry_fenced' END);
END $$;
REVOKE ALL ON FUNCTION public.media_cleanup_finish(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.media_cleanup_finish(uuid,uuid,boolean) TO service_role;

-- Rollout only: discover legacy bytes from storage metadata, no deletion.
-- Review owners, metadata, references and external/static protections separately.
CREATE OR REPLACE FUNCTION public.media_register_legacy()
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inserted bigint; t record; a record; payload record;
BEGIN
  PERFORM pg_advisory_xact_lock(771829461);
  INSERT INTO media_assets(owner_id,bucket,object_key,bytes,mime,state,lease_until)
  SELECT NULL,bucket_id,name,(metadata->>'size')::bigint,metadata->>'mimetype','ready',now()
  FROM storage.objects WHERE bucket_id IN ('images','store-files') AND metadata->>'mimetype' LIKE 'image/%'
    AND metadata->>'size' ~ '^[0-9]+$' AND name !~* '(^|/)(audio|episodes)(/|$)'
  ON CONFLICT(bucket,object_key) DO NOTHING;
  GET DIAGNOSTICS inserted=ROW_COUNT;
  -- Rebuild references without replaying content writes or modifying site data.
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE 'media_%' LOOP
    FOR payload IN EXECUTE format('SELECT to_jsonb(t) AS value FROM public.%I t',t.tablename) LOOP
      IF payload.value->>'id' IS NULL THEN RAISE EXCEPTION 'source_without_id'; END IF;
      FOR a IN SELECT * FROM media_assets LOOP
        IF strpos(media_normalize(payload.value::text),media_normalize(a.object_key))>0 THEN
          INSERT INTO media_references VALUES(a.id,t.tablename,payload.value->>'id') ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  RETURN inserted;
END $$;
REVOKE ALL ON FUNCTION public.media_register_legacy() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.media_register_legacy() TO service_role;