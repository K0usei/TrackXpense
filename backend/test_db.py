from app.db.base import engine
from sqlalchemy import text

def test_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.scalar()
            print("Successfully connected to PostgreSQL")
            print(f"PostgreSQL version: {version}")
    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    test_connection()