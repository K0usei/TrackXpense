from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models import Receipt
from typing import List
from ...schemas import ReceiptResponse

router = APIRouter(
    prefix="/receipts",
    tags=["receipts"]
)

@router.get("/", response_model=List[ReceiptResponse])
def get_receipts(user_id: str, db: Session = Depends(get_db)):
    receipts = db.query(Receipt).filter(Receipt.user_id == user_id).all()
    return receipts

