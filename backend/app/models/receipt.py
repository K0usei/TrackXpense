from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import BaseModel
from datetime import datetime

class Receipt(BaseModel):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    vendor = Column(String)
    address = Column(String, nullable=True)  # Store address
    date = Column(DateTime)
    time = Column(String)
    total = Column(Float)
    subtotal = Column(Float, nullable=True)  # Subtotal amount
    tax = Column(Float)
    discount = Column(Float, nullable=True)  # Discount amount
    change = Column(Float)
    category = Column(String)
    items = Column(JSON)  # Stores array of items
    image_urls = Column(JSON)  # Stores array of image URLs
    confidence = Column(Float)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="receipts")
