# Start both the frontend and backend servers with HTTP

# Function to check if a port is in use
function Test-PortInUse {
    param (
        [int]$Port
    )
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $connections.Count -gt 0
}

# Kill any processes using port 8000 (backend)
if (Test-PortInUse -Port 8000) {
    Write-Host "Port 8000 is in use. Attempting to free it..." -ForegroundColor Yellow
    $processes = Get-Process | Where-Object {
        $_.Modules | Where-Object {
            $_.FileName -like "*python*"
        }
    } | Where-Object {
        $connections = Get-NetTCPConnection -OwningProcess $_.Id -LocalPort 8000 -ErrorAction SilentlyContinue
        $connections.Count -gt 0
    }
    
    foreach ($process in $processes) {
        Write-Host "Stopping process $($process.Id) ($($process.ProcessName))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force
    }
}

# Kill any processes using port 3000 (frontend)
if (Test-PortInUse -Port 3000) {
    Write-Host "Port 3000 is in use. Attempting to free it..." -ForegroundColor Yellow
    $processes = Get-Process | Where-Object {
        $_.Modules | Where-Object {
            $_.FileName -like "*node*"
        }
    } | Where-Object {
        $connections = Get-NetTCPConnection -OwningProcess $_.Id -LocalPort 3000 -ErrorAction SilentlyContinue
        $connections.Count -gt 0
    }
    
    foreach ($process in $processes) {
        Write-Host "Stopping process $($process.Id) ($($process.ProcessName))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force
    }
}

# Get local IP address for display purposes
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -like "192.*" }).IPAddress
if (-not $localIp) {
    $localIp = "your-local-ip"
}

# Display information
Write-Host "Starting TrackXpense with HTTP..." -ForegroundColor Green
Write-Host "Frontend will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Network: http://$localIp`:3000" -ForegroundColor Cyan
Write-Host "Backend will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "  - Network: http://$localIp`:8000" -ForegroundColor Cyan
Write-Host "API endpoints will be available at:" -ForegroundColor Cyan
Write-Host "  - Local:   http://localhost:8000/api" -ForegroundColor Cyan
Write-Host "  - Network: http://$localIp`:8000/api" -ForegroundColor Cyan

# Start the backend server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .\start-http.ps1"

# Wait for the backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start the frontend server
Write-Host "Starting frontend..." -ForegroundColor Green
Set-Location $PSScriptRoot
.\start-admin-http.ps1
