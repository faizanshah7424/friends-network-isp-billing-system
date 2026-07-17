import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "friends-network-super-secret-key-change-in-production-fnb"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520  # 8 days
    PROJECT_NAME: str = "Friends Network ISP Billing System API"
    DATABASE_URL: str = "sqlite:///./friends_network.db"

    # Environment settings
    ENVIRONMENT: str = "production"
    LOG_LEVEL: str = "INFO"
    FRONTEND_URL: Optional[str] = "http://localhost:3000"
    UPLOAD_DIR: str = "backend/static/uploads"
    STATIC_DIR: str = "backend/static"
    PORT: int = 8000

    # MikroTik Settings
    MIKROTIK_HOST: str = ""
    MIKROTIK_PORT: int = 8728
    MIKROTIK_USERNAME: str = "admin"
    MIKROTIK_PASSWORD: str = ""

    # Database connection pool settings (Phase 5)
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 1800
    DB_POOL_PRE_PING: bool = True

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4000",
        "http://127.0.0.1:4000",
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        # Convert postgres:// to postgresql:// for compatibility with SQLAlchemy 1.4+ / 2.0+ (Phase 4)
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @property
    def cors_origins(self) -> List[str]:
        if self.ENVIRONMENT == "development":
            return ["*"]
        origins = list(self.BACKEND_CORS_ORIGINS)
        if self.FRONTEND_URL:
            # Allow comma-separated lists of URLs in FRONTEND_URL env var
            for url in self.FRONTEND_URL.split(","):
                clean_url = url.strip()
                if clean_url and clean_url not in origins:
                    origins.append(clean_url)
        return origins

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

