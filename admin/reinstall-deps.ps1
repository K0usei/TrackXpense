# Script to clean and reinstall dependencies

Write-Host "Cleaning node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

Write-Host "Dependencies reinstalled successfully!" -ForegroundColor Cyan
