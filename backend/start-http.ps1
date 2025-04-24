# Activate the virtual environment
.\venv\Scripts\activate

# Start the FastAPI server with HTTP (no SSL)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
