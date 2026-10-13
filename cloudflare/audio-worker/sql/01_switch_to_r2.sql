-- Run ONLY after the Worker test passes. Replace AUDIO_BASE below with the Worker address.
-- Step 1 keeps a full copy of the current links (rollback plan). Safe to re-run.
BEGIN;

CREATE TABLE IF NOT EXISTS public.audio_episodes_url_backup (
  episode_id uuid PRIMARY KEY,
  old_audio_url text NOT NULL,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.audio_episodes_url_backup TO service_role;
ALTER TABLE public.audio_episodes_url_backup ENABLE ROW LEVEL SECURITY;

INSERT INTO public.audio_episodes_url_backup (episode_id, old_audio_url)
SELECT id, audio_url FROM public.audio_episodes
WHERE audio_url LIKE '%/storage/v1/object/public/images/audio/%'
ON CONFLICT (episode_id) DO NOTHING;

-- Step 2: point links at the R2 service (keeps the original sub-path).
UPDATE public.audio_episodes
SET audio_url = 'AUDIO_BASE/episodes/' ||
  split_part(audio_url, '/storage/v1/object/public/images/audio/', 2)
WHERE audio_url LIKE '%/storage/v1/object/public/images/audio/%';

-- Check before committing: every row should now start with AUDIO_BASE.
SELECT id, title, audio_url FROM public.audio_episodes ORDER BY display_order;

COMMIT;
