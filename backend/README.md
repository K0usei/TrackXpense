# TrackXpense Backend

This is the backend API for the TrackXpense application. It provides OCR processing, receipt data extraction, and category prediction services.

## Features

- Receipt scanning with OCR (EasyOCR)
- Automatic expense categorization (XGBoost)
- RESTful API endpoints for frontend integration
- Database integration with Prisma and SQLAlchemy

## Getting Started

### Setup

1. Create a virtual environment:

```bash
python -m venv venv
```

2. Activate the virtual environment:

```bash
# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. Install dependencies:

```bash
# Using pip
pip install -r requirements.txt

# Using Poetry (recommended)
poetry install
```

4. Set up environment variables:

Create a `.env` file in the backend directory with the following variables:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trackxpense
GEMINI_API_KEY=your-gemini-api-key
```

5. Generate Prisma client and run migrations:

```bash
# On Windows
.\generate-prisma.ps1

# Manually
cd prisma
python -m prisma generate
python -m prisma migrate dev --name init
python seed.py
```

### Running the Server

Start the server with HTTPS:

```bash
# Using the start-https.ps1 script (Windows)
.\start-https.ps1

# Using Python directly
uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0
```

Or start without HTTPS for development:

```bash
# Using the start-http.ps1 script (Windows)
.\start-http.ps1

# Using Python directly
uvicorn main:app --reload --host 0.0.0.0
```

## API Endpoints

- `/api/ocr/process-receipt` - Process receipt images with OCR
- `/api/ocr/predict-category` - Predict expense category
- `/api/receipts` - CRUD operations for receipts

## Project Structure

- `/app` - Main application code
  - `/api` - API endpoints
  - `/core` - Core functionality
  - `/db` - Database models and connections
  - `/models` - Data models
  - `/schemas` - Pydantic schemas
  - `/services` - Business logic services
- `/ml` - Machine learning models
- `/models` - Trained model files
- `/prisma` - Prisma schema and migrations
- `/scripts` - Utility scripts
- `/tasks` - Background tasks

## Development

### Database Management

#### Using Prisma (Recommended)

```bash
# Generate Prisma client
python -m prisma generate

# Create a migration
python -m prisma migrate dev --name <migration_name>

# Apply migrations
python -m prisma migrate deploy

# Seed the database
python prisma/seed.py
```

#### Using Alembic (Alternative)

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Testing

```bash
# Run tests
pytest
```
