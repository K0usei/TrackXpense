# TrackXpense Frontend (Admin)

This directory contains the Next.js frontend application for TrackXpense.

## Features

- Receipt scanning with webcam
- Expense visualization and analytics
- Budget tracking and management
- AI-powered financial assistant
- Progressive Web App (PWA) capabilities

## Getting Started

### Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in this directory with the following variables:

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
# or
# NEXT_PUBLIC_API_URL=https://localhost:8000/api

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### Running the Server

Start the server with HTTPS:

```bash
# Using npm script
npm run dev
```

Or start with HTTP for development:

```bash
# Using npm script
npm run dev:http
# or
next dev
```

### Utility Scripts

The admin directory includes utility scripts to help with common tasks:

```bash
# Clean and reinstall dependencies
.\reinstall-deps.ps1
```

This script:

1. Removes the node_modules directory and package-lock.json
2. Reinstalls all dependencies with npm install

Use this script when you encounter dependency-related issues or after pulling significant changes from the repository.

## Project Structure

- `/src`: Source code
  - `/app`: Next.js App Router pages and API routes
  - `/components`: React components
  - `/contexts`: React context providers
  - `/hooks`: Custom React hooks
  - `/lib`: Utility functions and services
  - `/types`: TypeScript type definitions

## Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
# With HTTPS
npm run start:https

# With HTTP
npm start
```
