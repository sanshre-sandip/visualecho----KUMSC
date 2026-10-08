from __future__ import annotations

import asyncio
import logging
from collections.abc import Sequence
from contextlib import suppress
from typing import Any

from app.services.llm.base import (
    LLMGenerationResult,
    LLMImage,
    LLMProvider,
    LLMProviderNotConfiguredError,
    LLMProviderUnavailableError,
    LLMRateLimitedError,
    LLMRequestError,
    LLMTimeoutError,
)

logger = logging.getLogger(__name__)


class GoogleGeminiProvider(LLMProvider):
    name = "google-gemini"

    def __init__(
        self,
        *,
        api_key: str | None,
        model: str,
        timeout_seconds: float = 20.0,
    ) -> None:
        self._api_key = (api_key or "").strip()
        self._model = model.strip()
        self._timeout_seconds = timeout_seconds

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
        images: Sequence[LLMImage] | None = None,
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

        contents: Any = prompt
        if images:
            contents = [prompt]
            for image in images:
                contents.append(
                    types.Part.from_bytes(
                        data=image.data,
                        mime_type=image.mime_type,
                    )
                )

        client: Any = None
        try:
            client = genai.Client(api_key=self._api_key)
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=self._model,
                    contents=contents,
                    config=types.GenerateContentConfig(**config_kwargs),
                ),
                timeout=self._timeout_seconds,
            )
        except (TimeoutError, asyncio.TimeoutError) as exc:
            logger.warning(
                "Google Gemini request timed out after %.1fs",
                self._timeout_seconds,
            )
            raise LLMTimeoutError() from exc
        except Exception as exc:
            raise _map_provider_exception(exc) from exc
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


def _map_provider_exception(exc: Exception) -> LLMProviderError:
    status = getattr(exc, "code", None)
    if status == 429:
        logger.warning("Google Gemini rate limited")
        return LLMRateLimitedError()
    logger.error("Google Gemini request failed (%s)", type(exc).__name__)
    return LLMProviderUnavailableError()
