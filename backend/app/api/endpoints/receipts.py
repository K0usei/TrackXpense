from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models import Receipt
from typing import List
from ...schemas import ReceiptResponse
import os
import shutil
import uuid
# datetime import removed as it's not used

router = APIRouter(
    prefix="/receipts",
    tags=["receipts"]
)

# Create uploads directory if it doesn't exist
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

@router.get("/", response_model=List[ReceiptResponse])
def get_receipts(user_id: str, db: Session = Depends(get_db)):
    receipts = db.query(Receipt).filter(Receipt.user_id == user_id).all()
    return receipts

@router.post("/upload")
async def upload_receipt_image(
    file: UploadFile = File(...),
    userId: str = Form(...),
    timestamp: str = Form(...),
    contentType: str = Form(...),
    sectionIndex: str = Form("0")  # Add section index for multiple sections
):
    try:
        # Create a unique filename with section index
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        unique_filename = f"{userId}-{timestamp}-section{sectionIndex}-{uuid.uuid4()}{file_extension}"

        # Create user directory if it doesn't exist
        user_dir = os.path.join(UPLOADS_DIR, userId)
        os.makedirs(user_dir, exist_ok=True)

        # Save the file
        file_path = os.path.join(user_dir, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate URL for the file
        # In a real production environment, this would be a CDN or cloud storage URL
        # For local development, we'll use a relative path
        file_url = f"/uploads/{userId}/{unique_filename}"

        return {
            "url": file_url,
            "filename": unique_filename,
            "sectionIndex": sectionIndex
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image/{image_id}")
async def get_receipt_image(image_id: str):
    try:
        # In a real implementation, this would fetch from a database or storage service
        # For now, we'll just return a mock URL
        return {"url": f"/uploads/{image_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
