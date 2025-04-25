# TrackXpense Project Structure

This document provides an overview of the TrackXpense project structure to help developers navigate the codebase.

## Frontend (Next.js)

The frontend is built with Next.js and is organized as follows:

### `/src` Directory

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
- **`/hooks`**: Custom React hooks
- **`/lib`**: Utility functions and services
  - **`/services`**: Service classes for API interactions
- **`/middleware`**: Next.js middleware
- **`/providers`**: Provider components
- **`/styles`**: Global styles
- **`/types`**: TypeScript type definitions

### `/public` Directory

- Static assets like images, icons, and fonts

### `/prisma` Directory

- Prisma schema and migrations for database

## Backend (FastAPI)

The backend is built with FastAPI and is organized as follows:

### `/backend` Directory

- **`/app`**: Main application code
  - **`/api`**: API endpoints and routes
  - **`/core`**: Core application settings
  - **`/db`**: Database connection
  - **`/models`**: SQLAlchemy models
  - **`/schemas`**: Pydantic schemas
  - **`/services`**: Service classes

- **`/ml`**: Machine learning models and utilities
  - **`/models`**: Trained ML models
  - BERT for receipt field classification
  - XGBoost for expense categorization

- **`/services`**: Backend services
  - **`/receipt_processor.py`**: Receipt processing service
  - **`/category_predictor.py`**: Category prediction service

- **`/alembic`**: Database migrations
- **`/data`**: Data files and samples
- **`/scripts`**: Utility scripts
- **`/tasks`**: Background tasks
- **`/uploads`**: Uploaded files storage

## Configuration Files

- **`next.config.js`**: Next.js configuration
- **`tailwind.config.js`**: Tailwind CSS configuration
- **`tsconfig.json`**: TypeScript configuration
- **`package.json`**: NPM dependencies and scripts
- **`requirements.txt`**: Python dependencies
- **`ml/requirements.txt`**: ML-specific Python dependencies

## Entry Points

- **`server.js`**: Custom HTTPS server for Next.js
- **`backend/main.py`**: FastAPI application entry point
- **`backend/start_api.py`**: Script to start the backend API with HTTPS
