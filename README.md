# TrackXpense

TrackXpense is an AI-powered expense tracking progressive web application (PWA) that uses OCR to scan receipts, automatically categorize expenses, and provide financial insights.

## Features

- Receipt scanning with OCR (EasyOCR)
- Automatic expense categorization (XGBoost)
- Expense visualization and analytics
- Budget tracking and receipt management
- AI-powered financial assistant

## Project Structure

TrackXpense is organized into two main components:

- **admin**: Frontend application built with Next.js
- **backend**: Backend API built with FastAPI
- **docs**: Project documentation

For detailed documentation, see the [docs](docs/README.md) directory.

## Getting Started

### Frontend Setup

1. Navigate to the admin directory:

```bash
cd admin
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend server:

```bash
# With HTTPS
npm run dev

# With HTTP
npm run dev:http
# or
next dev
```

For HTTPS, this will start the Next.js server with HTTPS enabled on port 3000. The server uses self-signed certificates located in the `certificates` directory.

For HTTP, this will start the Next.js development server on port 3000.

Open [https://localhost:3000](https://localhost:3000) (HTTPS) or [http://localhost:3000](http://localhost:3000) (HTTP) with your browser to see the result.

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
# Using pip
pip install -r requirements.txt

# Using Poetry (recommended)
poetry install
```

5. Start the backend server:

```bash
# With HTTPS
uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0 --port 8000

# With HTTP
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

This will start the FastAPI server on port 8000 with either HTTPS or HTTP enabled.

### Accessing the Application

When running with HTTPS:

- Frontend: https://localhost:3000
- Backend API: https://localhost:8000

When running with HTTP:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

To access the application from other devices on your network, use your computer's IP address instead of localhost:

When running with HTTPS:

- Frontend: https://your-ip-address:3000
- Backend API: https://your-ip-address:8000

When running with HTTP:

- Frontend: http://your-ip-address:3000
- Backend API: http://your-ip-address:8000

Note: When using HTTPS, since the application uses self-signed certificates, you may need to accept security warnings in your browser.

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

For comprehensive security guidelines, see [Security Guidelines](docs/security.md).

## Dependencies

TrackXpense uses a variety of dependencies for both frontend and backend components. For a complete list, see [Dependencies](docs/dependencies.md).

### Utility Scripts

The project includes several utility scripts to help with common tasks:

#### Installation Scripts

```bash
# Install all dependencies for both frontend and backend
.\install-all.ps1

# Clean install frontend dependencies
.\clean-install-and-start.ps1
```

#### Backend Scripts

```bash
# Generate Prisma client, run migrations, and seed the database
cd backend
.\generate-prisma.ps1
```

#### Frontend Scripts

```bash
# Clean and reinstall frontend dependencies
cd admin
.\reinstall-deps.ps1
```

### Checking Dependencies

To check for missing dependencies, run:

```bash
# For frontend dependencies
node scripts/check-dependencies.js

# For backend dependencies
python backend/scripts/check_dependencies.py
```

## Documentation

For comprehensive documentation, please refer to the [docs](docs/README.md) directory, which includes:

- [Getting Started Guide](docs/getting-started.md)
- [Project Structure](docs/project-structure.md)
- [HTTPS Setup](docs/https-setup.md)
- [Connection Issues](docs/connection-issues.md)
- [Frontend Documentation](docs/frontend.md)
- [Backend Documentation](docs/backend.md)
- [Machine Learning Documentation](docs/ml.md)
- [API Documentation](docs/api.md)
- [Utility Scripts](docs/utility-scripts.md)

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [EasyOCR Documentation](https://github.com/JaidedAI/EasyOCR)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)

## License

MIT
