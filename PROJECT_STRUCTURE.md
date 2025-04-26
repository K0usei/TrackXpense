# TrackXpense Project Structure

This document provides an overview of the TrackXpense project structure to help developers navigate the codebase.

## Project Organization

TrackXpense is organized into two main components:

- **admin**: Frontend application built with Next.js
- **backend**: Backend API built with FastAPI

## Frontend (Next.js)

The frontend is built with Next.js and is organized as follows:

### `/admin` Directory

- **`/src`**: Source code

  - **`/app`**: Next.js App Router pages and API routes
    - **`/(authenticated)`**: Pages that require authentication
    - **`/api`**: API routes
    - **`/auth`**: Authentication pages
    - **`/chat`**: Chat interface pages
    - **`/~offline`**: Offline fallback page
  - **`/components`**: React components
    - **`/auth`**: Authentication components
    - **`/chat`**: Chat interface components
    - **`/dashboard`**: Dashboard UI components
    - **`/layout`**: Layout components
    - **`/notifications`**: Notification components
    - **`/profile`**: User profile components
    - **`/receipts`**: Receipt management components
    - **`/reports`**: Financial reporting components
    - **`/scanner`**: Receipt scanning components
    - **`/ui`**: Reusable UI components
  - **`/contexts`**: React context providers
  - **`/css`**: CSS styles
  - **`/fonts`**: Font files
  - **`/hooks`**: Custom React hooks
  - **`/lib`**: Utility functions and services
    - **`/services`**: Service classes for API interactions
  - **`/middleware.ts`**: Next.js middleware
  - **`/types`**: TypeScript type definitions
  - **`/utils`**: Utility functions

- **`/public`**: Static assets like images, icons, and fonts
- **`components.json`**: UI component configuration
- **`next.config.mjs`**: Next.js configuration
- **`package.json`**: NPM dependencies and scripts
- **`postcss.config.mjs`**: PostCSS configuration
- **`server.js`**: Custom HTTPS server for Next.js
- **`tailwind.config.ts`**: Tailwind CSS configuration
- **`tsconfig.json`**: TypeScript configuration

## Backend (FastAPI)

The backend is built with FastAPI and is organized as follows:

### `/backend` Directory

- **`/app`**: Main application code

  - **`/api`**: API endpoints and routes
    - **`/endpoints`**: API route handlers
  - **`/core`**: Core application settings
  - **`/db`**: Database connection
  - **`/models`**: SQLAlchemy models
  - **`/schemas`**: Pydantic schemas
  - **`/services`**: Service classes

- **`/ml`**: Machine learning models and utilities

  - **`/data`**: Training data
  - **`/models`**: Trained ML models

- **`/models`**: Trained model files

  - **`/bert_receipt_classifier`**: BERT model for receipt field classification
  - **`/simplified_receipt_classifier`**: XGBoost model for expense categorization

- **`/alembic`**: Database migrations
- **`/data`**: Data files and samples

- **`/scripts`**: Utility scripts
- **`/tasks`**: Background tasks
- **`/uploads`**: Uploaded files storage

- **`main.py`**: FastAPI application entry point
- **`pyproject.toml`**: Python dependencies (Poetry)
- **`requirements.txt`**: Python dependencies (pip)
- **`start-http.ps1`**: Script to start the backend with HTTP
- **`start-https.ps1`**: Script to start the backend with HTTPS
- **`start_api.py`**: Script to start the backend API with HTTPS

## Root Directory

- **`/certificates`**: SSL certificates for HTTPS
- **`README.md`**: Project documentation
- **`start-admin.ps1`**: Script to start the frontend
- **`start-backend.ps1`**: Script to start the backend
- **`start-all.ps1`**: Script to start both frontend and backend
