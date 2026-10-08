from app.config import Settings
from app.services.llm.base import (
    LLMGenerationResult,
    LLMImage,
    LLMProvider,
    LLMProviderError,
    LLMProviderNotConfiguredError,
    LLMProviderUnavailableError,
    LLMRateLimitedError,
    LLMRequestError,
    LLMResponseInvalidError,
    LLMTimeoutError,
)
from app.services.llm.google_gemini import GoogleGeminiProvider

__all__ = [
    "GoogleGeminiProvider",
    "LLMGenerationResult",
    "LLMImage",
    "LLMProvider",
    "LLMProviderError",
    "LLMProviderNotConfiguredError",
    "LLMProviderUnavailableError",
    "LLMRateLimitedError",
    "LLMRequestError",
    "LLMResponseInvalidError",
    "LLMTimeoutError",
    "create_llm_provider",
]


def create_llm_provider(settings: Settings) -> LLMProvider:
    api_key = (
        settings.gemini_api_key.get_secret_value()
        if settings.gemini_api_key
        else None
    )
    return GoogleGeminiProvider(
        api_key=api_key,
        model=settings.gemini_model,
        timeout_seconds=settings.llm_timeout_seconds,
    )
