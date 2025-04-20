from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from ..db import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    receipts = relationship("Receipt", back_populates="user")


