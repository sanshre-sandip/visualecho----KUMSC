from __future__ import annotations

import logging
from contextlib import suppress
from typing import Any

from app.services.llm.base import (
    LLMGenerationResult,
    LLMProvider,
    LLMProviderNotConfiguredError,
    LLMProviderUnavailableError,
    LLMRequestError,
)

logger = logging.getLogger(__name__)


class GoogleGeminiProvider(LLMProvider):
    name = "google-gemini"

    def __init__(self, *, api_key: str | None, model: str) -> None:
        self._api_key = (api_key or "").strip()
        self._model = model.strip()

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key and self._model)

    async def generate(
        self,
        prompt: str,
        *,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_output_tokens: int | None = None,
    ) -> LLMGenerationResult:
        if not prompt.strip():
            raise LLMRequestError()
        if not self.is_configured:
            raise LLMProviderNotConfiguredError()

        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:
            logger.error("google-genai SDK is not installed")
            raise LLMProviderUnavailableError() from exc

        config_kwargs: dict[str, Any] = {}
        if system_instruction is not None:
            config_kwargs["system_instruction"] = system_instruction
        if temperature is not None:
            config_kwargs["temperature"] = temperature
        if max_output_tokens is not None:
            config_kwargs["max_output_tokens"] = max_output_tokens

        client: Any = None
        try:
            client = genai.Client(api_key=self._api_key)
            response = await client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(**config_kwargs),
            )
        except Exception as exc:
            logger.error(
                "Google Gemini request failed (%s)",
                type(exc).__name__,
            )
            raise LLMProviderUnavailableError() from exc
        finally:
            if client is not None:
                with suppress(Exception):
                    await client.aio.close()

        text = getattr(response, "text", None)
        return LLMGenerationResult(
            text=text or "",
            provider=self.name,
            model=self._model,
        )
