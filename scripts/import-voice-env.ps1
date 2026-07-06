# Copies voice API keys from Jude demo .env.local into MDC .env.local.
# Usage: powershell -File scripts/import-voice-env.ps1
# Optional: -JudeEnvPath "C:\path\to\.env.local"

param(
  [string]$JudeEnvPath = "",
  [string]$MdcEnvPath = "$PSScriptRoot\..\.env.local"
)

if (-not $JudeEnvPath) {
  $candidates = @(
    "$env:USERPROFILE\Jude\apps\demo\.env.local",
    "$PSScriptRoot\..\.env.voice-source"
  )
  foreach ($c in $candidates) {
    if (Test-Path $c) { $JudeEnvPath = $c; break }
  }
}

$copyKeys = @(
  "OPENAI_API_KEY",
  "ELEVENLABS_API_KEY",
  "OPENAI_REALTIME_MODEL",
  "ELEVENLABS_VOICE_ID",
  "ELEVENLABS_VOICE_ID_ALFRED"
)

if (-not (Test-Path $JudeEnvPath)) {
  Write-Error "Jude env not found at $JudeEnvPath"
  exit 1
}

function Read-EnvMap([string]$path) {
  $map = @{}
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') { $map[$matches[1].Trim()] = $matches[2].Trim() }
  }
  return $map
}

$jude = Read-EnvMap $JudeEnvPath
$lines = [System.Collections.Generic.List[string]]@()
if (Test-Path $MdcEnvPath) { $lines.AddRange([string[]](Get-Content $MdcEnvPath)) }

$present = @{}
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '^\s*([^#=]+)=(.*)$') {
    $key = $matches[1].Trim()
    $present[$key] = $true
    if ($copyKeys -contains $key -and $jude.ContainsKey($key) -and $jude[$key]) {
      $lines[$i] = "$key=$($jude[$key])"
    }
  }
}

foreach ($key in $copyKeys) {
  if ($present.ContainsKey($key)) { continue }
  if ($key -eq "ELEVENLABS_VOICE_ID_ALFRED") {
    if ($jude.ContainsKey("ELEVENLABS_VOICE_ID_ALFRED") -and $jude["ELEVENLABS_VOICE_ID_ALFRED"]) {
      $lines.Add("ELEVENLABS_VOICE_ID_ALFRED=$($jude['ELEVENLABS_VOICE_ID_ALFRED'])")
    }
    continue
  }
  if ($jude.ContainsKey($key) -and $jude[$key]) {
    $lines.Add("$key=$($jude[$key])")
  }
}

if (-not ($lines -match 'ELEVENLABS_VOICE_ID_ALFRED=')) {
  $lines.Add("ELEVENLABS_VOICE_ID_ALFRED=lUTamkMw7gOzZbFIwmq4")
}

Set-Content -Path $MdcEnvPath -Value $lines -Encoding utf8
Write-Host "Voice keys imported into $MdcEnvPath. Restart npm run dev."
