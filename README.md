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

### API Key Management

TrackXpense uses several external APIs that require API keys, including:

- Gemini API for the AI financial assistant
- Firebase for authentication and storage

#### Setting Up API Keys

1. Create a `.env.local` file in the root directory (if it doesn't exist)
2. Add your API keys to this file:

```
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trackxpense
```

#### API Key Security Best Practices

1. **Never commit API keys to version control**:

   - Ensure `.env.local` and other files with API keys are in your `.gitignore`
   - If you accidentally commit an API key, consider it compromised and generate a new one

2. **Use environment-specific keys**:

   - Development: Use separate API keys for development environments
   - Production: Use different API keys with appropriate restrictions
   - Testing: Consider using mock APIs for automated tests

3. **Restrict API key permissions**:

   - Limit API keys to only the permissions they need
   - Set usage quotas to prevent unexpected charges

4. **Rotate API keys periodically**:

   - Regularly generate new API keys, especially for production environments
   - Update keys immediately if there's any suspicion of compromise

5. **Use secrets management for production**:
   - For production deployments, use a secrets management service
   - Options include: Vercel Environment Variables, GitHub Secrets, AWS Secrets Manager, etc.

For comprehensive security guidelines, see [SECURITY.md](SECURITY.md).

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
