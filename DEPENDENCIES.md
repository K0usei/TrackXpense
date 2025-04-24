# TrackXpense Dependencies

This document outlines the dependencies used in the TrackXpense application, both for the frontend and backend components.

## Frontend Dependencies

### Core Framework
- **next**: Next.js framework for React applications
- **react**: Core React library
- **react-dom**: React DOM rendering

### UI Components
- **@radix-ui/react-***: Various Radix UI components for accessible UI elements
- **class-variance-authority**: Utility for creating variant components
- **clsx**: Utility for conditionally joining classNames
- **tailwindcss**: Utility-first CSS framework
- **tailwind-merge**: Utility for merging Tailwind CSS classes
- **tailwindcss-animate**: Animation utilities for Tailwind CSS
- **framer-motion**: Animation library for React
- **lucide-react**: Icon library
- **react-icons**: Icon library
- **sonner**: Toast notifications
- **geist-ui**: UI component library

### Forms and Validation
- **react-hook-form**: Form handling library
- **@hookform/resolvers**: Resolvers for react-hook-form
- **zod**: TypeScript-first schema validation

### Data Visualization
- **recharts**: Composable charting library
- **date-fns**: Date utility library

### Authentication and Storage
- **firebase**: Firebase client SDK
- **firebase-admin**: Firebase admin SDK
- **next-auth**: Authentication for Next.js

### API and Data Fetching
- **axios**: HTTP client
- **socket.io-client**: WebSocket client

### Image Processing and OCR
- **react-webcam**: React component for webcam access
- **browser-image-compression**: Image compression library
- **tesseract.js**: OCR library for JavaScript

### AI and Machine Learning
- **@google/generative-ai**: Google's Generative AI SDK
- **@tensorflow/tfjs**: TensorFlow.js for machine learning in the browser
- **openai**: OpenAI API client

### PWA and Offline Support
- **@serwist/core**: Service worker library
- **@serwist/next**: Next.js integration for Serwist
- **serwist**: Service worker utilities

### Database
- **@prisma/client**: Prisma client for database access
- **prisma**: Prisma ORM

### Development and Testing
- **typescript**: TypeScript language
- **eslint**: Linting utility
- **vitest**: Testing framework
- **@testing-library/react**: Testing utilities for React
- **@testing-library/jest-dom**: DOM testing utilities

## Backend Dependencies

### Web Framework
- **fastapi**: Fast API framework
- **uvicorn**: ASGI server
- **python-multipart**: Multipart form data parsing
- **httpx**: HTTP client
- **aiofiles**: Asynchronous file operations

### Database
- **sqlalchemy**: SQL toolkit and ORM
- **psycopg2-binary**: PostgreSQL adapter
- **alembic**: Database migration tool
- **prisma**: Prisma ORM for Python
- **redis**: Redis client

### Authentication & Security
- **firebase-admin**: Firebase Admin SDK
- **python-jose**: JSON Web Token implementation
- **passlib**: Password hashing library
- **bcrypt**: Password hashing
- **email-validator**: Email validation

### Data Processing & ML
- **numpy**: Numerical computing
- **pandas**: Data analysis and manipulation
- **easyocr**: OCR library
- **pillow**: Image processing
- **python-magic**: File type detection
- **scikit-learn**: Machine learning library
- **xgboost**: Gradient boosting
- **joblib**: Parallel computing
- **torch**: PyTorch deep learning framework

### AI & NLP
- **openai**: OpenAI API client
- **google-generativeai**: Google's Generative AI SDK
- **transformers**: Hugging Face Transformers
- **sentencepiece**: Tokenizer for NLP
- **protobuf**: Protocol Buffers

### Utilities
- **pydantic**: Data validation
- **pydantic-settings**: Settings management
- **python-dotenv**: Environment variable management
- **tenacity**: Retry library
- **PyYAML**: YAML parser
- **tqdm**: Progress bar
- **matplotlib**: Plotting library

### Task Queue
- **celery**: Distributed task queue
- **flower**: Celery monitoring tool

### Development & Testing
- **pytest**: Testing framework
- **pytest-asyncio**: Async testing
- **black**: Code formatter
- **isort**: Import sorter
- **flake8**: Linter
- **mypy**: Static type checker

## ML-Specific Dependencies

The ML components have additional specific requirements:

### Core ML
- **numpy**: Numerical computing
- **pandas**: Data analysis
- **scikit-learn**: Machine learning
- **xgboost**: Gradient boosting
- **joblib**: Model serialization

### Deep Learning
- **torch**: PyTorch
- **transformers**: Hugging Face Transformers
- **sentencepiece**: Tokenizer
- **protobuf**: Protocol Buffers

### OCR
- **easyocr**: OCR library
- **Pillow**: Image processing
- **opencv-python**: Computer vision
- **python-magic**: File type detection

### AI & NLP
- **google-generativeai**: Google's Generative AI
- **openai**: OpenAI API

### Utilities
- **tqdm**: Progress bars
- **matplotlib**: Plotting
- **PyYAML**: YAML parsing
- **tenacity**: Retry logic
