# TrackXpense

TrackXpense is an AI-powered expense tracking progressive web application (PWA) that uses OCR to scan receipts, automatically categorize expenses, and provide financial insights.

## Features

- Receipt scanning with OCR (EasyOCR)
- Automatic expense categorization (XGBoost)
- Expense visualization and analytics
- Budget tracking and receipt management
- AI-powered financial assistant

## Getting Started

### Frontend Setup

First, run the development server with HTTPS enabled:

```bash
npm run dev
```

This will start the Next.js server with HTTPS enabled on port 3000. The server uses self-signed certificates located in the `certificates` directory.

Open [https://localhost:3000](https://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Backend Setup

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

6. Start the backend server with HTTPS:

```bash
# Method 1: Using the start_api.py script (recommended)
python start_api.py

# Method 2: Using uvicorn directly
uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0
```

This will start the FastAPI server with HTTPS enabled on port 8000.

### Accessing the Application

- Frontend: https://localhost:3000
- Backend API: https://localhost:8000

To access the application from other devices on your network, use your computer's IP address instead of localhost:

- Frontend: https://your-ip-address:3000
- Backend API: https://your-ip-address:8000

Note: Since the application uses self-signed certificates, you may need to accept security warnings in your browser.

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

## Project Structure

For a detailed overview of the project structure, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

For a visual map of components and their relationships, see [COMPONENT_MAP.md](COMPONENT_MAP.md).

Key directories:

- [Frontend Components](src/components/README.md)
- [Frontend Utilities](src/lib/README.md)
- [Frontend Services](src/lib/services/README.md)
- [Backend Application](backend/app/README.md)
- [Machine Learning Models](backend/ml/README.md)

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [EasyOCR Documentation](https://github.com/JaidedAI/EasyOCR)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)

## License

MIT
