from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    DATABASE_URL: str = ""
    JWT_SECRET_KEY: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REFRESH_TOKEN: str = ""
    GOOGLE_DRIVE_FOLDER_ID: str = ""   # Optional, can be left empty
    N8N_WEBHOOK_URL: str = ""          # Optional
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_ALGORITHM: str = "HS256"
    OPENAI_API_KEY: str = ""
    GOOGLE_SERVICE_ACCOUNT_FILE: Path = Path(__file__).resolve().parent / "service_account.json"
    WEAVIATE_URL:  str = "http://weaviate:8080"
    class Config:
        env_file = Path(__file__).resolve().parent / ".env"
        env_file_encoding = 'utf-8'

    @property
    def google_creds_path(self) -> str:
        """Returns the absolute path to the service account file."""
        return str(Path(self.GOOGLE_SERVICE_ACCOUNT_FILE).resolve())

settings = Settings()
