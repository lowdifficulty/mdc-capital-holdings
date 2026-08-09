# Deploy A2P site to production (Windows)
# Run: powershell -ExecutionPolicy Bypass -File scripts/deploy-prod.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host ""
Write-Host "=== MDC Capital Holdings - production deploy ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: Node.js is not installed or not on PATH." -ForegroundColor Red
  exit 1
}

Write-Host "[1/4] git pull ..."
git pull origin master
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/4] npm install ..."
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/4] npm run build ..."
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[4/4] vercel deploy --prod ..."
Write-Host "      (Log in to Vercel in the browser if prompted.)" -ForegroundColor Yellow
npx vercel deploy --prod
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Deploy failed. If you are not logged in, run: npx vercel login" -ForegroundColor Red
  Write-Host "Or set up GitHub Actions: see docs/DEPLOY.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Done. Open https://mdccapitalholdings.com" -ForegroundColor Green
Write-Host "Look for 'Business information' in the hero (A2P site)." -ForegroundColor Green
Write-Host ""
