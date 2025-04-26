# Script to clean install dependencies and start the application with HTTP

Write-Host "Starting clean installation and startup process..." -ForegroundColor Green

# Clean and reinstall frontend dependencies
Write-Host "Cleaning and reinstalling frontend dependencies..." -ForegroundColor Cyan
Set-Location $PSScriptRoot\admin

# Clean installation to avoid dependency issues
Write-Host "Cleaning node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

# Return to root directory
Set-Location $PSScriptRoot

# Start the application with HTTP
Write-Host "Starting the application with HTTP..." -ForegroundColor Cyan
.\start-all-http.ps1
