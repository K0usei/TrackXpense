from app.db.base_class import Base
from app.db.session import engine
from app.models.receipt import Receipt
from app.models.receipt_image import ReceiptImage

# Import all models here to ensure they are registered with SQLAlchemy

def create_tables():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    create_tables()
