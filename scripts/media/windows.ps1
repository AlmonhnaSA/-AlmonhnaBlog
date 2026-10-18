param(
  [Parameter(Mandatory=$true)][ValidateSet('preflight','inventory','dry-run','copy','verify','setup-images','rollback')][string]$Action,
  [Parameter(Mandatory=$true)][string]$SecretFile,
  [switch]$ApproveExternalChange
)
$ErrorActionPreference = 'Stop'
# Private env file lives OUTSIDE the checkout, never pasted into chat or Git.
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$secret = (Resolve-Path $SecretFile).Path
if ($secret.StartsWith($root + [IO.Path]::DirectorySeparatorChar)) { throw 'Keep secret settings outside the project.' }
Set-Location $root
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) { throw 'Install Bun first.' }
# Bun reads credentials directly; PowerShell never prints their values.
$argsBase = @("--env-file=$secret")
$reportDir = Join-Path $root 'media-reports'
$env:MEDIA_REPORT_DIR = $reportDir
switch ($Action) {
  'preflight' { & bun @argsBase scripts/media/preflight.ts }
  'inventory' { & bun @argsBase scripts/storage-inventory.ts }
  'dry-run' { & bun @argsBase scripts/media/migrate-images.ts dry-run "$reportDir/inventory.json" }
  'copy' {
    if (-not $ApproveExternalChange) { throw 'Copy requires explicit approval; no existing files will be overwritten.' }
    $env:MEDIA_COPY_APPROVED='true'
    try { & bun @argsBase scripts/media/migrate-images.ts copy "$reportDir/inventory.json" } finally { Remove-Item Env:MEDIA_COPY_APPROVED -ErrorAction SilentlyContinue }
  }
  'verify' { & bun @argsBase scripts/media/migrate-images.ts verify "$reportDir/inventory.json" }
  'setup-images' {
    if (-not $ApproveExternalChange) { throw 'Creating/deploying image infrastructure requires approval.' }
    # Separate bucket/worker only; no DNS change, no audio commands.
    & bunx wrangler r2 bucket create almonhna-images
    if ($LASTEXITCODE -ne 0) { throw 'Bucket creation failed or already exists; inspect before retry.' }
    & bunx wrangler deploy --config cloudflare/image-worker/wrangler.toml
  }
  'rollback' {
    Write-Output 'No data rewrite/deletion occurred. Disable R2_IMAGES_ENABLED on the independent function, remove VITE_IMAGE_BASE_URL and VITE_IMAGE_SOURCE_PROJECT from the next manually deployed Vercel build; keep both buckets and original files. Keep deletion disabled. Existing direct R2 image links still require the image worker.'
  }
}
if ($LASTEXITCODE -ne 0 -and $Action -ne 'rollback') { throw 'Operation stopped. No automatic follow-up is performed.' }