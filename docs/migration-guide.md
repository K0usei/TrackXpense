# TrackXpense Migration Guide

This document provides guidance on migrating from the old project structure to the new structure with separated frontend and backend components.

## Project Structure Changes

TrackXpense has been restructured to follow a cleaner separation of concerns:

- **admin**: Frontend application built with Next.js
- **backend**: Backend API built with FastAPI

## Migration Steps

### For Developers

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/TrackXpense.git
   cd TrackXpense
   ```

2. **Set up the frontend**:

   ```bash
   cd admin
   npm install
   ```

3. **Set up the backend**:

   ```bash
   cd ../backend
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:

   - Copy `.env.example` to `.env.local` in the admin directory
   - Copy `.env.example` to `.env` in the backend directory
   - Update the environment variables with your API keys and configuration

5. **Start the application**:

   ```bash
   # Start the backend
   cd backend
   # Activate the virtual environment if needed
   .\venv\Scripts\activate
   # With HTTPS
   uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0 --port 8000
   # Or with HTTP
   uvicorn main:app --reload --host 0.0.0.0 --port 8000

   # In a separate terminal, start the frontend
   cd admin
   # With HTTPS
   npm run dev
   # Or with HTTP
   npm run dev:http
   ```

### For Users

If you're using the application as a user, the migration should be transparent. The application will continue to function as before, with the same features and user experience.

## API Changes

The API endpoints have been updated to proxy requests to the backend. The frontend now communicates with the backend through the following URL:

```
https://localhost:8000/api
```

This can be configured using the `NEXT_PUBLIC_API_URL` environment variable.

## File Structure Changes

### Frontend (admin)

- **src/**: Source code directory
  - **app/**: Next.js App Router pages and API routes
  - **components/**: React components
  - **contexts/**: React context providers
  - **hooks/**: Custom React hooks
  - **lib/**: Utility functions and services
  - **types/**: TypeScript type definitions

### Backend

- **app/**: Main application code
  - **api/**: API endpoints and routes
  - **core/**: Core application settings
  - **db/**: Database models and connections
  - **schemas/**: Pydantic schemas
  - **services/**: Business logic services
- **ml/**: Machine learning models
- **models/**: Trained model files

## Troubleshooting

If you encounter issues after the migration:

1. **API Connection Issues**:

   - Check that the backend is running on port 8000
   - Verify that the `NEXT_PUBLIC_API_URL` is set correctly in the frontend

2. **Missing Dependencies**:

   - Run `npm install` in the admin directory
   - Run `pip install -r requirements.txt` in the backend directory

3. **Certificate Issues**:
   - Ensure that SSL certificates are properly set up in the certificates directory
   - Run `mkcert -cert-file certificates/localhost.pem -key-file certificates/localhost-key.pem localhost 127.0.0.1 ::1 *.localhost`
