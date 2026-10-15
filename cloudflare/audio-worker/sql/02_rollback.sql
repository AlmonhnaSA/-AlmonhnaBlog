-- Restores the original storage links saved by 01_switch_to_r2.sql.
UPDATE public.audio_episodes e
SET audio_url = b.old_audio_url
FROM public.audio_episodes_url_backup b
WHERE b.episode_id = e.id;
