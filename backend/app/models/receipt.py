from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..db import BaseModel
from datetime import datetime

class Receipt(BaseModel):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    vendor = Column(String)
    date = Column(DateTime)
    time = Column(String)
    total = Column(Float)
    tax = Column(Float)
    change = Column(Float)
    category = Column(String)
    items = Column(JSON)  # Stores array of items
    image_urls = Column(JSON)  # Stores array of image URLs
    confidence = Column(Float)
    
    user = relationship("User", back_populates="receipts")
