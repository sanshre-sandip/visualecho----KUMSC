from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import ClassVar

from pydantic import BaseModel


class LLMProviderError(Exception):
    """Base class for safe, client-facing LLM errors."""

    code: ClassVar[str] = "LLM_PROVIDER_ERROR"
    status_code: ClassVar[int] = 500

    def __init__(self, message: str = "LLM provider error") -> None:
        super().__init__(message)


class LLMProviderNotConfiguredError(LLMProviderError):
    code = "LLM_PROVIDER_NOT_CONFIGURED"
    status_code = 503

    def __init__(self) -> None:
        super().__init__("LLM provider is not configured")


class LLMProviderUnavailableError(LLMProviderError):
    code = "LLM_PROVIDER_UNAVAILABLE"
    status_code = 503

    def __init__(self) -> None:
        super().__init__("LLM provider is unavailable")


class LLMRateLimitedError(LLMProviderError):
    code = "LLM_RATE_LIMITED"
    status_code = 429

    def __init__(self) -> None:
        super().__init__("LLM provider rate limit exceeded")


class LLMTimeoutError(LLMProviderError):
    code = "LLM_TIMEOUT"
    status_code = 504

    def __init__(self) -> None:
        super().__init__("LLM provider request timed out")


class LLMResponseInvalidError(LLMProviderError):
    code = "LLM_RESPONSE_INVALID"
    status_code = 502

    def __init__(self) -> None:
        super().__init__("LLM provider returned an unreadable response")


class LLMRequestError(LLMProviderError):
    code = "LLM_REQUEST_INVALID"
    status_code = 400

    def __init__(self) -> None:
        super().__init__("LLM request is invalid")


class LLMImage(BaseModel):
    data: bytes
    mime_type: str


class LLMGenerationResult(BaseModel):
    text: str
    provider: str
    model: str


class LLMProvider(ABC):
    """Provider-agnostic interface for cloud LLM services."""

    name: ClassVar[str]

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        raise NotImplementedError

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        *,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        images: Sequence[LLMImage] | None = None,
    ) -> LLMGenerationResult:
        raise NotImplementedError
