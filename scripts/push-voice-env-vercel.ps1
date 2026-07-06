# Push voice keys from .env.local to Vercel (production + preview).
# Usage: powershell -File scripts/push-voice-env-vercel.ps1

param(
  [string]$MdcEnvPath = "$PSScriptRoot\..\.env.local"
)

$keys = @("OPENAI_API_KEY", "ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID_ALFRED", "OPENAI_REALTIME_MODEL")

function Read-EnvMap([string]$path) {
  $map = @{}
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') { $map[$matches[1].Trim()] = $matches[2].Trim() }
  }
  return $map
}

if (-not (Test-Path $MdcEnvPath)) {
  Write-Error ".env.local not found. Run scripts/import-voice-env.ps1 first."
  exit 1
}

$vars = Read-EnvMap $MdcEnvPath
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root

foreach ($key in $keys) {
  if (-not $vars.ContainsKey($key) -or -not $vars[$key]) { continue }
  $value = $vars[$key]
  foreach ($envName in @("production", "preview")) {
    $value | vercel env add $key $envName --force 2>&1 | Out-Host
  }
}

Pop-Location
Write-Host "Done. Run: vercel deploy --prod"
