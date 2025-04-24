# Start both the frontend and backend servers

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
    Write-Host "Port 8000 is in use. Attempting to free it..."
    $processes = Get-Process | Where-Object {
        $_.Modules | Where-Object {
            $_.FileName -like "*python*"
        }
    } | Where-Object {
        $connections = Get-NetTCPConnection -OwningProcess $_.Id -LocalPort 8000 -ErrorAction SilentlyContinue
        $connections.Count -gt 0
    }
    
    foreach ($process in $processes) {
        Write-Host "Stopping process $($process.Id) ($($process.ProcessName))"
        Stop-Process -Id $process.Id -Force
    }
}

# Start the backend server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .\start-http.ps1"

# Wait for the backend to start
Write-Host "Waiting for backend to start..."
Start-Sleep -Seconds 5

# Start the frontend server
Set-Location $PSScriptRoot
npm run dev
