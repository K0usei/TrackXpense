# Start the backend with HTTPS

# Check if certificates exist
if (-not (Test-Path -Path "certificates/localhost.pem") -or -not (Test-Path -Path "certificates/localhost-key.pem")) {
    Write-Host "Error: SSL certificates not found. Please run mkcert to generate them." -ForegroundColor Red
    exit 1
}

# Get local IP address for display purposes
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -like "192.*" }).IPAddress
if (-not $localIp) {
    $localIp = "your-local-ip"
}

Write-Host "Starting TrackXpense Backend with HTTPS..." -ForegroundColor Green
Write-Host "Backend will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   https://localhost:8000" -ForegroundColor Cyan
Write-Host "  - Network: https://$localIp`:8000" -ForegroundColor Cyan
Write-Host "API endpoints will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   https://localhost:8000/api" -ForegroundColor Cyan
Write-Host "  - Network: https://$localIp`:8000/api" -ForegroundColor Cyan

# Start the backend server
Set-Location $PSScriptRoot\backend
.\start-https.ps1
