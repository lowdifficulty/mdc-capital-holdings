# Push Twilio env to Vercel (run from repo root after filling .env.local)
# Usage: powershell -File scripts/push-twilio-env-vercel.ps1

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Host "Create .env.local from .env.example first."
  exit 1
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $name, $value = $_ -split '=', 2
  $name = $name.Trim()
  $value = $value.Trim()
  if ($name -notmatch '^TWILIO_') { return }
  if ([string]::IsNullOrWhiteSpace($value)) { return }
  Write-Host "Setting $name on Vercel production..."
  $value | vercel env add $name production --force 2>&1 | Out-Host
}

Write-Host "Done. Run: vercel deploy --prod"
