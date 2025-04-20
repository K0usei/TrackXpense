from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class ReceiptImage(Base):
    __tablename__ = "receipt_images"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    receipt_id = Column(String, ForeignKey("receipts.id"), nullable=True)
    filename = Column(String)
    original_filename = Column(String)
    file_path = Column(String)
    content_type = Column(String)
    upload_timestamp = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationship to Receipt
    receipt = relationship("Receipt", back_populates="images")
