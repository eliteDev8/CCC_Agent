from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Text
from backend.models import Base

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    response = Column(Text, nullable=True)
    media_ids = Column(Text, nullable=True)  # Comma-separated or JSON string of Media IDs
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 