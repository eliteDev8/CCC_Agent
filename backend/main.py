from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.v1 import auth, media, n8n, chat
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.models import Base
from backend.config import settings
from backend.models.user import User
from backend.services.auth_service import AuthService
from backend.services.weaviate_service import setup_schema

app = FastAPI()

origins = [
    "http://localhost:3000",  # React dev
    "http://localhost:5173",  # Vite dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    setup_schema()
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed default admin user
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(
            User.__table__.select().where(User.email == "admin@example.com")
        )
        admin = result.first()
        if not admin:
            admin_user = User(
                email="admin@example.com",
                hashed_password=AuthService.hash_password("admin123"),
                is_active=True,
                role="admin"
            )
            session.add(admin_user)
            await session.commit()

app.include_router(auth.router, prefix="/api/v1")
app.include_router(media.router, prefix="/api/v1")
app.include_router(n8n.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")