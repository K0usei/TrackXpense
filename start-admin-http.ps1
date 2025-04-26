# Start the frontend with HTTP

# Get local IP address for display purposes
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -like "192.*" }).IPAddress
if (-not $localIp) {
    $localIp = "your-local-ip"
}

Write-Host "Starting TrackXpense Admin with HTTP..." -ForegroundColor Green
Write-Host "Frontend will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Network: http://$localIp`:3000" -ForegroundColor Cyan

# Start the Next.js server with HTTP
Set-Location $PSScriptRoot\admin
npx next dev
