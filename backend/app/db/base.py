from .base_class import Base
from ..models.user import User  # noqa
from ..models.receipt import Receipt  # noqa

# Import all models here for Alembic to detect them
__all__ = ["Base", "User", "Receipt"]




