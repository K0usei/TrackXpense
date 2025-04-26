# Install dependencies for both frontend and backend

Write-Host "Installing TrackXpense dependencies..." -ForegroundColor Green

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location $PSScriptRoot\admin

# Clean installation to avoid dependency issues
Write-Host "Cleaning node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location $PSScriptRoot\backend

# Check if virtual environment exists
if (-not (Test-Path -Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\activate

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
Set-Location prisma
python -m prisma generate
Set-Location ..

# Return to root directory
Set-Location $PSScriptRoot

Write-Host "All dependencies installed successfully!" -ForegroundColor Green
Write-Host "You can now start the application with:" -ForegroundColor Cyan
Write-Host "  .\start-all.ps1" -ForegroundColor Cyan
