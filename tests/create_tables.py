import asyncio
from backend.database import engine, Base

async def create_all():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(create_all())