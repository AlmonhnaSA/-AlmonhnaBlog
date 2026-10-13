# Almonhna audio service (Cloudflare Worker + R2)

Serves `almonhna-audio/episodes/...` through an R2 bucket binding (no R2 keys anywhere),
with Range/seek support, long-lived caching and CORS for https://www.almonhna.sa.

## Deploy (one time, from this folder)
```bash
npx wrangler login
npx wrangler deploy
```
Then open `https://almonhna-audio.<your-subdomain>.workers.dev/health` (should print `ok`).

## Test a file
```bash
curl -I -H "Range: bytes=0-99" https://almonhna-audio.<sub>.workers.dev/episodes/7ce8d098-b839-40df-9d49-91640545b256/1791725865180.mp3
```
Expect `206` and `Content-Range: bytes 0-99/9047302`.
Both layouts work: `episodes/<user>/<file>` and `episodes/audio/<user>/<file>`.

## Switching the site (two options, both reversible)
- **No database change:** set `VITE_AUDIO_BASE_URL=https://almonhna-audio.<sub>.workers.dev`
  in the site's hosting environment and redeploy. Old links are rewritten at play time.
  Remove the variable to roll back.
- **Updating a file:** never overwrite an existing path. Upload the new version under a new unique name and update the episode link; query strings such as ?v= are ignored and do not refresh caches.
- **Permanent:** run `sql/01_switch_to_r2.sql` (after replacing `AUDIO_BASE`).
  Roll back with `sql/02_rollback.sql`.
