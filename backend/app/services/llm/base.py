from __future__ import annotations

from abc import ABC, abstractmethod
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


class LLMRequestError(LLMProviderError):
    code = "LLM_REQUEST_INVALID"
    status_code = 400

    def __init__(self) -> None:
        super().__init__("LLM request is invalid")


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
    ) -> LLMGenerationResult:
        raise NotImplementedError
