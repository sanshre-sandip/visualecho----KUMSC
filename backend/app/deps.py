from __future__ import annotations

from fastapi import Depends

from app.config import settings
from app.services.ai_service import AIService
from app.services.llm import create_llm_provider
from app.services.llm.base import LLMProvider


def get_llm_provider() -> LLMProvider:
    return create_llm_provider(settings)


def get_ai_service(
    provider: LLMProvider = Depends(get_llm_provider),
) -> AIService:
    return AIService(provider)
