from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ReceiptItem(BaseModel):
    name: str
    price: float
    quantity: int
    category: Optional[str] = 'Others'

class ReceiptCreate(BaseModel):
    # STORE section
    vendor: str
    address: Optional[str] = None

    # ITEMS section
    items: List[ReceiptItem]

    # TOTAL section
    subtotal: float
    tax: float = 0.0
    discount: float = 0.0
    change: float = 0.0
    total: float

    # OTHERS section
    date: str
    time: str

    # Additional metadata
    category: str = 'Others'
    image_urls: List[str]
    user_id: str
    confidence: Optional[float] = None

class ReceiptResponse(BaseModel):
    id: int

    # STORE section
    vendor: str
    address: Optional[str] = None

    # ITEMS section
    items: List[ReceiptItem]

    # TOTAL section
    subtotal: float
    tax: float
    discount: float
    change: float
    total: float

    # OTHERS section
    date: datetime
    time: str

    # Additional metadata
    category: str
    image_urls: List[str]
    confidence: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True