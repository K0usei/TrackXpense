from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

engine = create_engine(
    settings.DATABASE_URI,
    pool_pre_ping=True,
    echo=True  # Set to False in production
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


