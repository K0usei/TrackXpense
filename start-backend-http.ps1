# Start the backend with HTTP

# Get local IP address for display purposes
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -like "192.*" }).IPAddress
if (-not $localIp) {
    $localIp = "your-local-ip"
}

Write-Host "Starting TrackXpense Backend with HTTP..." -ForegroundColor Green
Write-Host "Backend will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "  - Network: http://$localIp`:8000" -ForegroundColor Cyan
Write-Host "API endpoints will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   http://localhost:8000/api" -ForegroundColor Cyan
Write-Host "  - Network: http://$localIp`:8000/api" -ForegroundColor Cyan

# Start the backend server
Set-Location $PSScriptRoot\backend
.\start-http.ps1
