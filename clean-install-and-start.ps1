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

# Start the application
Write-Host "Starting the application..." -ForegroundColor Cyan
Write-Host "Please start the backend and frontend servers separately:" -ForegroundColor Yellow
Write-Host "  Backend (HTTP): cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Cyan
Write-Host "  Backend (HTTPS): cd backend && uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0 --port 8000" -ForegroundColor Cyan
Write-Host "  Frontend (HTTP): cd admin && npm run dev:http" -ForegroundColor Cyan
Write-Host "  Frontend (HTTPS): cd admin && npm run dev" -ForegroundColor Cyan
