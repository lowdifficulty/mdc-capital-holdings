# Kill stale Next on 3001, remove .next, start dev. Run from repo root:
#   powershell -ExecutionPolicy Bypass -File scripts/restart-dev.ps1

$ErrorActionPreference = "SilentlyContinue"
$ports = @(3000, 3001)

foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match "next" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 1
if (Test-Path ".next") {
  Write-Host "Removing .next ..."
  Remove-Item -Recurse -Force .next
}

Write-Host "Starting http://localhost:3001 ..."
npm run dev
