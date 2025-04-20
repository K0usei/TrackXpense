from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .db.base import Base
from datetime import datetime

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))

    # STORE section
    vendor = Column(String)  # Store name
    address = Column(String, nullable=True)  # Store address

    # ITEMS section - stored as JSON array
    items = Column(JSON)  # Stores array of items with name, quantity, price, category

    # TOTAL section
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    change = Column(Float, default=0.0)
    total = Column(Float)  # This is the final total amount

    # OTHERS section
    date = Column(DateTime)
    time = Column(String)

    # Additional metadata
    category = Column(String)  # Overall receipt category
    image_urls = Column(JSON)  # Stores array of image URLs
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="receipts")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime)
    expenses = relationship("Expense", back_populates="user")
    receipts = relationship("Receipt", back_populates="user")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    amount = Column(Float)
    category = Column(String)
    date = Column(DateTime)
    description = Column(String)
    receipt_url = Column(String, nullable=True)
    user = relationship("User", back_populates="expenses")
