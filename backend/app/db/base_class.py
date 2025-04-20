from datetime import datetime
from typing import Any
from sqlalchemy.ext.declarative import declared_attr, declarative_base
from sqlalchemy import Column, DateTime

class CustomBase:
    # Generate __tablename__ automatically
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()

    # Add id as primary key to all tables by default
    id: Any
    
    # Add created_at and updated_at timestamps to all tables
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

# Create the Base class
Base = declarative_base(cls=CustomBase)

# Create BaseModel that inherits from Base
class BaseModel(Base):
    """
    Base model class that includes common fields and functionality
    for all models in the application.
    """
    __abstract__ = True  # Tells SQLAlchemy not to create a table for this model