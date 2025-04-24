# TrackXpense

TrackXpense is an AI-powered expense tracking application that uses OCR to scan receipts, automatically categorize expenses, and provide financial insights.

## Features

- Receipt scanning with OCR (EasyOCR)
- Automatic expense categorization (XGBoost)
- Financial insights and analytics
- Budget tracking and management
- AI-powered financial assistant

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
```

3. Activate the virtual environment:

```bash
# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. For ML components, install additional dependencies:

```bash
pip install -r ml/requirements.txt
```

6. Start the backend server:

```bash
uvicorn main:app --reload
```

## Dependencies

TrackXpense uses a variety of dependencies for both frontend and backend components. For a complete list, see [DEPENDENCIES.md](DEPENDENCIES.md).

### Checking Dependencies

To check for missing dependencies, run:

```bash
# For frontend dependencies
node scripts/check-dependencies.js

# For backend dependencies
python backend/scripts/check_dependencies.py
```

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [EasyOCR Documentation](https://github.com/JaidedAI/EasyOCR)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)

## License

MIT
