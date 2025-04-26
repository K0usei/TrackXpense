# Start the frontend with HTTP

Write-Host "Starting TrackXpense Admin with HTTP..." -ForegroundColor Green
Write-Host "Frontend will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   http://localhost:3000" -ForegroundColor Cyan

# Start the Next.js server with HTTP
Set-Location $PSScriptRoot
npm run dev:http
