from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.db import get_db
from backend.models.user import User
from backend.services.agent_service import process_chat_message
from backend.api.v1.auth import get_current_user
from backend.config import settings
import httpx
import re

router = APIRouter(prefix="/n8n", tags=["n8n"])

@router.post("/webhook")
async def n8n_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    data = await request.json()
    email = data.get("email")
    message = data.get("message", "Hello from webhook!")
    match = re.search(r'<([^>]+)>', email)
    email = match.group(1) if match else None
    # Find user by email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return {"error": "User not found"}

    reply = await process_chat_message(db, user, message)
    return reply

@router.get("/webhook")
async def n8n_webhook1(request: Request):
    # data = await request.json()
    print("Received n8n webhook data:")
    # Process incoming n8n webhook data
    return {"received": "GET request to n8n webhook"}

@router.post("/trigger")
async def trigger_n8n(current_user: User = Depends(get_current_user)):
    # Example: trigger n8n workflow via HTTP
    if not settings.N8N_WEBHOOK_URL:
        return {"error": "n8n webhook URL not configured"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(settings.N8N_WEBHOOK_URL, json={"user_id": current_user.id})
        return {"status": resp.status_code, "response": resp.json()}