# TrackXpense Frontend Documentation

This document provides information about the TrackXpense frontend application built with Next.js.

## Overview

The frontend is a Next.js application that provides a user interface for:

- Scanning and managing receipts
- Tracking expenses and budgets
- Visualizing financial data
- Interacting with the AI financial assistant

## Project Structure

The frontend code is located in the `admin` directory and follows this structure:

```
admin/
├── public/               # Static assets
├── src/                  # Source code
│   ├── app/              # Next.js App Router pages
│   │   ├── (authenticated)/  # Pages requiring authentication
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── layout/       # Layout components
│   │   ├── receipts/     # Receipt components
│   │   ├── scanner/      # Scanner components
│   │   └── ui/           # UI components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   │   └── services/     # Service classes
│   └── types/            # TypeScript types
├── .env.local            # Environment variables
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies
├── server.js             # Custom HTTPS server
└── tailwind.config.ts    # Tailwind CSS configuration
```

## Getting Started

1. Install dependencies:

```bash
cd admin
npm install
```

2. Set up environment variables:

Create a `.env.local` file with the following variables:

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

3. Start the development server:

```bash
# With HTTP
npm run dev:http
# or
next dev

# With HTTPS
npm run dev
```

## Key Features

### Receipt Scanner

The receipt scanner uses the device camera to capture receipt images, which are then processed by the backend OCR service.

Key components:

- `components/scanner/ScannerView.tsx` - Main scanner interface
- `components/scanner/CameraCapture.tsx` - Camera capture component
- `lib/services/ocr-service.ts` - Service for OCR processing

### Dashboard

The dashboard displays financial insights and expense summaries.

Key components:

- `components/dashboard/DashboardView.tsx` - Main dashboard interface
- `components/dashboard/ExpenseSummary.tsx` - Expense summary component
- `components/dashboard/BudgetProgress.tsx` - Budget progress component

### AI Assistant

The AI assistant provides financial advice and answers questions about expenses.

Key components:

- `components/chat/ChatInterface.tsx` - Chat interface component
- `lib/services/ai-service.ts` - Service for AI interactions

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

## Utility Scripts

The admin directory includes utility scripts to help with common tasks:

```bash
# Clean and reinstall dependencies
.\reinstall-deps.ps1
```

## Troubleshooting

If you encounter issues with the frontend:

1. Check that the backend server is running and accessible
2. Verify that your environment variables are set correctly
3. Try reinstalling dependencies with `.\reinstall-deps.ps1`
4. Check the browser console for error messages
