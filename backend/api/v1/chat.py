from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.api.v1.auth import get_current_user
from backend.models.user import User
from backend.models.chat import Chat
from backend.models.media import Media
from sqlalchemy.future import select
from typing import List, Optional
import json
import logging
from backend.config import settings
from pydantic import BaseModel
from backend.services.agent_service import process_chat_message

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

@router.get("/history")
async def get_chat_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100)
):
    result = await db.execute(
        select(Chat)
        .where(Chat.user_id == current_user.id)
        .order_by(Chat.created_at.asc())  # Order by date ascending
        .limit(limit)
    )
    chats = result.scalars().all()
    return [
        {
            "id": chat.id,
            "message": chat.message,
            "response": chat.response,
            "media_ids": json.loads(getattr(chat, 'media_ids', '') or '[]'),
            "created_at": getattr(chat, "created_at", None)
        }
        for chat in chats
    ]

@router.post("")
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await process_chat_message(db, current_user, req.message)