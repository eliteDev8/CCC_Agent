from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from backend.models import Base

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    filetype = Column(String, nullable=False)
    gdrive_id = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)  # size in bytes
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 