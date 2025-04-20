# Activate the virtual environment
.\venv\Scripts\activate

# Start the FastAPI server with HTTPS
uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0
