# Getting Started with TrackXpense

This guide will help you set up and run the TrackXpense application for local development.

## Prerequisites

- Node.js (v16 or later)
- Python (v3.11 or later)
- PostgreSQL database
- Git

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/TrackXpense.git
cd TrackXpense
```

2. Install all dependencies:

```bash
# Using the installation script (Windows)
.\install-all.ps1

# Or manually:
# Frontend dependencies
cd admin
npm install

# Backend dependencies
cd ../backend
python -m venv venv
.\venv\Scripts\activate  # On Windows
source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
```

3. Set up environment variables:

For the frontend (admin/.env.local):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# API URL (use HTTP or HTTPS depending on your backend setup)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

For the backend (backend/.env):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trackxpense
GEMINI_API_KEY=your-gemini-api-key
```

4. Set up the database:

```bash
cd backend
.\generate-prisma.ps1  # On Windows

# Or manually:
cd prisma
python -m prisma generate
python -m prisma migrate dev --name init
python seed.py
```

## Running the Application

### Starting the Backend

Navigate to the backend directory and run:

```bash
# Activate the virtual environment if needed
.\venv\Scripts\activate  # On Windows
source venv/bin/activate  # On macOS/Linux

# With HTTP (for development)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# With HTTPS (if you have SSL certificates)
uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0 --port 8000
```

### Starting the Frontend

Navigate to the admin directory and run:

```bash
# With HTTP (for development)
npm run dev:http
# or
next dev

# With HTTPS (if you have SSL certificates)
npm run dev
```

## Accessing the Application

When running with HTTP:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

When running with HTTPS:

- Frontend: https://localhost:3000
- Backend API: https://localhost:8000
- API Documentation: https://localhost:8000/docs

## Setting Up HTTPS (Optional)

For HTTPS setup instructions, see [HTTPS Setup](https-setup.md).

## Troubleshooting

If you encounter any issues, see [Connection Issues](connection-issues.md) for common problems and solutions.
