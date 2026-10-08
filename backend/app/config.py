from __future__ import annotations

from pathlib import Path

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
SERVICE_NAME = "visualecho-backend"
DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"
DEV_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:19006",
    "http://localhost:8081",
    "http://localhost:3000",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    environment: str = "development"
    service_name: str = SERVICE_NAME
    gemini_api_key: SecretStr | None = None
    gemini_model: str = DEFAULT_GEMINI_MODEL
    llm_timeout_seconds: float = Field(default=20.0, ge=1.0, le=300.0)
    max_request_bytes: int = Field(default=6_000_000, ge=1024)
    cors_origins: str = ""

    @field_validator("gemini_api_key", mode="before")
    @classmethod
    def _empty_key_is_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("gemini_model", mode="before")
    @classmethod
    def _empty_model_uses_default(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return DEFAULT_GEMINI_MODEL
        return value

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        explicit = [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]
        if explicit:
            return explicit
        if self.is_production:
            return []
        return list(DEV_CORS_ORIGINS)

    @property
    def gemini_configured(self) -> bool:
        if self.gemini_api_key is None:
            return False
        return bool(self.gemini_api_key.get_secret_value().strip())


settings = Settings()
