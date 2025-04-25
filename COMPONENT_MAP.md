# TrackXpense Component Map

This document provides a visual map of the key components and their relationships in the TrackXpense application.

## Frontend Component Hierarchy

```
App
├── AuthProvider
│   └── DashboardLayout
│       ├── Sidebar
│       │   └── Navigation
│       ├── Header
│       │   ├── NotificationsDropdown
│       │   └── UserMenu
│       └── Content
│           ├── Dashboard
│           │   ├── StatsCards
│           │   ├── ExpenseChart
│           │   ├── CategoryBreakdown
│           │   └── RecentTransactions
│           ├── Scanner
│           │   ├── AdvancedReceiptScanner
│           │   ├── ReceiptDataView
│           │   └── CategorySelector
│           ├── Reports
│           │   ├── ActivityReport
│           │   ├── BudgetReport
│           │   └── ExpenseTrends
│           ├── Assistant
│           │   ├── ChatInterface
│           │   └── ConversationHistory
│           └── Profile
│               ├── UserSettings
│               ├── BudgetSettings
│               └── NotificationSettings
```

## Backend Service Architecture

```
FastAPI App
├── API Endpoints
│   ├── OCR Endpoints
│   │   ├── process_receipt
│   │   └── save_receipt
│   └── Receipt Endpoints
│       ├── get_receipts
│       ├── get_receipt
│       └── delete_receipt
├── Services
│   ├── ReceiptProcessor
│   │   ├── EasyOCR
│   │   ├── BERT Field Classifier
│   │   └── XGBoost Category Predictor
│   └── FeedbackCollector
├── Database
│   ├── SQLAlchemy Models
│   │   ├── User
│   │   ├── Receipt
│   │   ├── ReceiptImage
│   │   └── Expense
│   └── PostgreSQL
└── Authentication
    └── Firebase Auth
```

## Data Flow

```
User Interaction → Frontend Components → API Calls → Backend Services → Database
                                      ↑                    ↓
                                      └────── Response ────┘
```

## Key Integration Points

1. **Receipt Scanning Flow**:
   - AdvancedReceiptScanner captures image
   - OCRService processes image
   - Backend ReceiptProcessor extracts data
   - ReceiptDataView displays extracted data
   - User confirms and saves receipt

2. **Financial Assistant Flow**:
   - User enters query in ChatInterface
   - Query sent to Gemini API
   - Response processed and displayed
   - Conversation history updated

3. **Dashboard Data Flow**:
   - User selects timeframe
   - API fetches expense data
   - Data processed and visualized in charts
   - Stats cards updated with summary metrics
