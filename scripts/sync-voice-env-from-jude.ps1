# Pull voice keys from Jude Vercel project, import into MDC .env.local, push to MDC Vercel.
# Usage: powershell -File scripts/sync-voice-env-from-jude.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$voiceSource = Join-Path $root ".env.voice-source"

Push-Location "$env:USERPROFILE\Jude\apps\demo"
vercel env pull $voiceSource --environment=production --yes
Pop-Location

& "$PSScriptRoot\import-voice-env.ps1" -JudeEnvPath $voiceSource -MdcEnvPath (Join-Path $root ".env.local")
& "$PSScriptRoot\push-voice-env-vercel.ps1" -MdcEnvPath (Join-Path $root ".env.local")

Write-Host "Synced. Restart npm run dev, then vercel deploy --prod for production."
