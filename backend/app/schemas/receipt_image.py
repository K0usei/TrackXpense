from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ReceiptImageBase(BaseModel):
    user_id: str
    filename: str
    content_type: str

class ReceiptImageCreate(ReceiptImageBase):
    original_filename: str
    file_path: str
    upload_timestamp: datetime
    receipt_id: Optional[str] = None

class ReceiptImageResponse(BaseModel):
    id: str
    url: str
    filename: str
    contentType: str
    
    class Config:
        orm_mode = True
