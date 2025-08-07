import json
import logging
import asyncio
from fastapi import HTTPException
from openai import AsyncOpenAI
from backend.models.chat import Chat
from backend.config import settings

from backend.services.weaviate_service import (
    get_weaviate_client,
    save_message_to_weaviate,
    get_recent_messages,
    search_relevant_messages
)

wclient = None
client = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def build_prompt(history, current_message):
    recent_msgs = [msg for msg in history if msg.get("source") == "recent"]
    relevant_msgs = [msg for msg in history if msg.get("source") == "relevant"]

    def format_history(msgs):
        formatted = []
        for msg in msgs:
            other = msg.get("text", "")
            mine = msg.get("my_message", "")
            timestamp = msg.get("timestamp", "")
            formatted.append(f"{{{other}, {mine}, {timestamp}}}")
        return "\n".join(formatted)

    def format_history1(msgs):
        formatted = []
        for msg in msgs:
            other = msg.get("text", "")
            timestamp = msg.get("timestamp", "")
            formatted.append(f"{{{other}, {timestamp}}}")
        return "\n".join(formatted)

    recent_history_str = format_history(recent_msgs)
    relevant_history_str = format_history(relevant_msgs)

    system_instruction = (
        "I am an entrepreneur.\n"
        "Below is a conversation between me and another person.\n"
        "Each exchange is written in the format: {the other person's message, my message, timestamp}.\n"
        f"{recent_history_str}\n"
        "And this is chat histories you have to refer.\n"
        "Each history is written in the format: {history, timestamp}.\n"
        f"{relevant_history_str}\n"
        "Role: Think as me (a real human, not an assistant)"
        "Analyze: Tone, intent, emotion of the latest message"
        "Use: Only relevant past context"
        "Consider: Relationship type (casual/professional), emotional flow (trust, humor, tension)"
        "Goal: Respond naturally to move the conversation forward"
        "Style: Output only my next message"
        "Use human, realistic tone (casual, warm, witty, or empathetic)"
        "Avoid robotic or scripted language"
        "Reminder: This is real conversation, not chatbot interaction"
        "Message Type: May be a question or statement — respond accordingly"
    )
    prompt = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": current_message},
    ]
    return prompt

async def process_chat_message(db, user, message: str):
    global client
    if client is None:
        try:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        except Exception as e:
            logger.error(f"Failed to create OpenAI client: {e}")
            raise HTTPException(status_code=500, detail=f"OpenAI client error: {e}")

    global wclient
    if wclient is None:
        try:
            wclient = get_weaviate_client()
        except RuntimeError as e:
            logger.error(f"Weaviate client error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    recent_objs = await get_recent_messages(db, user.id, N=10)
    recent_messages = [
        {"text": obj.message, "my_message": obj.response, "timestamp": str(obj.created_at), "source": "recent"}
        for obj in recent_objs
    ]

    # Use text search for relevant messages
    relevant_objs = await search_relevant_messages(wclient, message, top_k=10)
    recent_texts = set(msg["text"] for msg in relevant_objs)
    relevant_messages = [
        {"text": obj.properties["text"], "timestamp": obj.properties.get("timestamp", ""), "source": "relevant"}
        for obj in relevant_objs if obj.properties["text"] not in recent_texts
    ]
    logger.info(f"relevant message: {relevant_messages}")


    prompt_history = (
        sorted(recent_messages, key=lambda x: x["timestamp"], reverse=True)
        +
        sorted(relevant_messages, key=lambda x: x["timestamp"], reverse=True)
    )

    prompt_messages = build_prompt(prompt_history, message)
    # logger.info(f"Prompt: {prompt_messages}")

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=prompt_messages,
            temperature=0.9,
            timeout=10
        )
        response_text = response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")

    try:
        chat = Chat(
            user_id=user.id,
            message=message,
            response=response_text,
            media_ids=json.dumps([])
        )
        db.add(chat)
        await db.commit()
        await db.refresh(chat)
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    # Save response to Weaviate (no embedding needed)
    await save_message_to_weaviate(wclient, user.id, f"Other:{message}, me:{response_text}")

    return {
        "type": "text",
        "text": response_text,
        "media": None
    }