# Generate Prisma client for Python

# Activate the virtual environment
.\venv\Scripts\activate

# Generate the Prisma client
Write-Host "Generating Prisma client for Python..." -ForegroundColor Green
cd prisma
python -m prisma generate

# Run migrations if needed
Write-Host "Running Prisma migrations..." -ForegroundColor Green
python -m prisma migrate dev --name init

# Seed the database
Write-Host "Seeding the database..." -ForegroundColor Green
python seed.py

Write-Host "Prisma client generated successfully!" -ForegroundColor Green
