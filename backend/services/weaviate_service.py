import time
import weaviate
from weaviate.classes.config import Property, DataType
from datetime import datetime, timezone
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
client = None  # Global client variable

def setup_schema():
    global client
    logger.info("Setting up Weaviate schema...")  
    for i in range(10):
        try:
            client = weaviate.connect_to_local(host="weaviate", port=8080, skip_init_checks=True)
            break
        except Exception as e:
            logger.warning(f"Weaviate not ready, retrying in 5s... ({e})")
            time.sleep(5)
    
    # if "ChatMessage" not in client.collections.list_all():
    #     client.collections.create(
    #         "ChatMessage",
    #         vectorizer_config=[
    #             wvc.config.Configure.NamedVectors.text2vec_transformers(
    #                 name="text_vector",
    #                 source_properties=["text"]
    #             )
    #         ],
    #         properties=[
    #             Property(name="text", data_type=DataType.TEXT),
    #             Property(name="user_id", data_type=DataType.TEXT),
    #             Property(name="timestamp", data_type=DataType.DATE),
    #         ]
    #     )
    
    # if "FileInfo" not in client.collections.list_all():
    #     client.collections.create(
    #         "FileInfo",
    #         properties=[
    #             Property(name="filename", data_type=DataType.TEXT),
    #             Property(name="filedetail", data_type=DataType.TEXT),
    #             Property(name="user_id", data_type=DataType.TEXT),
    #             Property(name="timestamp", data_type=DataType.DATE),
    #         ]
    #     )

def get_weaviate_client():
    if client is None:
        raise RuntimeError("Weaviate client is not initialized. Call setup_schema() first.")
    return client

async def save_message_to_weaviate(wclient, user_id, text):
    wclient.collections.get("ChatMessage").data.insert(
        properties={
            "text": text,
            "user_id": str(user_id),
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        }
    )

async def search_relevant_messages(wclient, text, top_k=5):
    try:
        relevant_objs = wclient.collections.get("ChatMessage").query.near_text(
            query=text,
            target_vector="text_vector",
            limit=top_k
        )
        return relevant_objs.objects  # List of objects
    except Exception as e:
        logger.warning(f"Weaviate semantic search error: {e}")
        return []

def shutdown():
    if client:
        client.close()


from backend.models.chat import Chat
from sqlalchemy import select, desc

async def get_recent_messages(db, user_id, N=10):
    """
    Fetch recent chat messages for a user from the PostgreSQL database.
    Returns a list of Chat objects (or ORM rows).
    """
    try:
        result = await db.execute(
            select(Chat)
            .where(user_id == user_id)
            .order_by(desc(Chat.created_at))
            .limit(N)
        )
        messages = result.scalars().all()
        return messages
    except Exception as e:
        logger.warning(f"PostgreSQL recent fetch error: {e}")
        return []