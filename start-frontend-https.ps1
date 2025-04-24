# Start the frontend with HTTPS

# Check if certificates exist
if (-not (Test-Path -Path "certificates/localhost.pem") -or -not (Test-Path -Path "certificates/localhost-key.pem")) {
    Write-Host "Error: SSL certificates not found. Please run mkcert to generate them." -ForegroundColor Red
    exit 1
}

# Check if server.js exists
if (-not (Test-Path -Path "server.js")) {
    Write-Host "Error: server.js not found. This file is required for HTTPS." -ForegroundColor Red
    exit 1
}

# Get local IP address for display purposes
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -like "192.*" }).IPAddress
if (-not $localIp) {
    $localIp = "your-local-ip"
}

Write-Host "Starting Next.js with HTTPS..." -ForegroundColor Green
Write-Host "Frontend will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   https://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Network: https://$localIp`:3000" -ForegroundColor Cyan

# Start the Next.js server with the custom HTTPS configuration
node server.js
