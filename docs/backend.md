# TrackXpense Backend Documentation

This document provides information about the TrackXpense backend API built with FastAPI.

## Overview

The backend is a FastAPI application that provides:
- OCR processing for receipt images
- Expense categorization using machine learning
- Database operations for storing and retrieving expense data
- AI-powered financial assistant capabilities

## Project Structure

The backend code is located in the `backend` directory and follows this structure:

```
backend/
├── app/                  # Main application code
│   ├── api/              # API endpoints
│   │   └── endpoints/    # API route handlers
│   ├── core/             # Core functionality
│   ├── db/               # Database connection
│   ├── models/           # Data models
│   ├── schemas/          # Pydantic schemas
│   └── services/         # Business logic services
├── ml/                   # Machine learning models
│   ├── data/             # Training data
│   └── models/           # Trained models
├── prisma/               # Prisma schema and migrations
├── scripts/              # Utility scripts
├── tasks/                # Background tasks
├── uploads/              # Uploaded files storage
├── .env                  # Environment variables
├── main.py               # FastAPI application entry point
├── pyproject.toml        # Python dependencies (Poetry)
└── requirements.txt      # Python dependencies (pip)
```

## Getting Started

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

Create a `.env` file with the following variables:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trackxpense
GEMINI_API_KEY=your-gemini-api-key
```

5. Generate Prisma client and run migrations:

```bash
# Using the script
.\generate-prisma.ps1

# Or manually
cd prisma
python -m prisma generate
python -m prisma migrate dev --name init
python seed.py
```

6. Start the server:

```bash
# With HTTP
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# With HTTPS
uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0 --port 8000
```

## API Endpoints

### OCR Endpoints

- `POST /api/ocr/process-receipt` - Process receipt images with OCR
  - Accepts a multipart/form-data request with an image file
  - Returns structured receipt data

- `POST /api/ocr/predict-category` - Predict expense category
  - Accepts a JSON request with receipt data
  - Returns the predicted category and confidence score

### Receipt Endpoints

- `GET /api/receipts` - Get all receipts
- `GET /api/receipts/{receipt_id}` - Get a specific receipt
- `POST /api/receipts` - Create a new receipt
- `PUT /api/receipts/{receipt_id}` - Update a receipt
- `DELETE /api/receipts/{receipt_id}` - Delete a receipt

### Health Check

- `GET /health` - Check API health status

## Database Management

### Using Prisma (Recommended)

You can use the provided script to handle all Prisma operations at once:

```bash
# Generate Prisma client, run migrations, and seed the database
.\generate-prisma.ps1
```

Or run the commands individually:

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

### Using Alembic (Alternative)

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

## Machine Learning Models

The backend includes machine learning models for receipt field extraction and expense categorization. For more information, see [Machine Learning Documentation](ml.md).

## Utility Scripts

The backend includes several utility scripts:

```bash
# Generate Prisma client, run migrations, and seed the database
.\generate-prisma.ps1

# Run model retraining
.\tasks\run_retraining.ps1
```

## Troubleshooting

If you encounter issues with the backend:

1. Check that your database is running and accessible
2. Verify that your environment variables are set correctly
3. Check the server logs for error messages
4. Ensure that the required model files are present in the models directory
