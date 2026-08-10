# Create or update .env.local for Twilio SMS (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-local-twilio.ps1

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$envFile = Join-Path $root ".env.local"

Write-Host ""
Write-Host "=== Local Twilio setup (.env.local) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open https://console.twilio.com and copy Account SID (starts with AC)"
Write-Host "2. Use your API Key (SK...) + Secret, OR Main Auth Token from the console"
Write-Host "3. Use your Twilio SMS-enabled phone number in E.164 format"
Write-Host ""

$accountSid = Read-Host "TWILIO_ACCOUNT_SID (AC...)"
$apiKeySid = Read-Host "TWILIO_API_KEY_SID (SK..., or Enter to skip)"
$apiKeySecret = Read-Host "TWILIO_API_KEY_SECRET (or Enter to skip)"
if (-not $apiKeySecret -and $apiKeySid) { $apiKeySecret = Read-Host "TWILIO_API_KEY_SECRET" }
$authToken = Read-Host "TWILIO_AUTH_TOKEN (optional if using API key)"
$phone = Read-Host "TWILIO_PHONE_NUMBER (e.g. +19497558994)"

$lines = @(
  "# Local dev — do not commit",
  "SESSION_SECRET=mdc-local-dev-change-this-session-secret",
  "ADMIN_EMAIL=1",
  "ADMIN_PASSWORD=1",
  "TWILIO_ACCOUNT_SID=$accountSid",
  "TWILIO_AUTH_TOKEN=$authToken",
  "TWILIO_API_KEY_SID=$apiKeySid",
  "TWILIO_API_KEY_SECRET=$apiKeySecret",
  "TWILIO_PHONE_NUMBER=$phone",
  ""
)
Set-Content -Path $envFile -Value ($lines -join "`n") -Encoding UTF8

Write-Host ""
Write-Host "Wrote $envFile" -ForegroundColor Green
Write-Host "Run: npm run dev:clean" -ForegroundColor Yellow
Write-Host ""
