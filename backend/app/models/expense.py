from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from .base import Base
from typing import Optional
from datetime import datetime

class Expense(Base):
    """
    Model for storing expense data.
    This is used to track expenses, which can be linked to receipts.
    """
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    amount = Column(Float)
    category = Column(String, index=True)
    date = Column(DateTime)
    description = Column(String)
    receipt_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __init__(
        self,
        user_id: str,
        amount: float,
        category: str,
        date: datetime,
        description: str,
        receipt_url: Optional[str] = None
    ):
        self.user_id = user_id
        self.amount = amount
        self.category = category
        self.date = date
        self.description = description
        self.receipt_url = receipt_url
