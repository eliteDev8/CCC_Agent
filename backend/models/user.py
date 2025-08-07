from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from backend.models import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user", nullable=False)  # 'admin' or 'user'
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 