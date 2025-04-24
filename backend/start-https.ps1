# Activate the virtual environment
.\venv\Scripts\activate

# Check if certificates exist
if (-not (Test-Path -Path "../certificates/localhost.pem") -or -not (Test-Path -Path "../certificates/localhost-key.pem")) {
    Write-Host "Error: SSL certificates not found. Please run mkcert to generate them." -ForegroundColor Red
    exit 1
}

# Start the FastAPI server with HTTPS
Write-Host "Starting FastAPI server with HTTPS..." -ForegroundColor Green
Write-Host "Backend will be available at: https://localhost:8000" -ForegroundColor Cyan
Write-Host "API endpoints will be available at: https://localhost:8000/api" -ForegroundColor Cyan

uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0
