from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.deps import get_llm_provider
from app.main import app
from app.services.llm.base import (
    LLMGenerationResult,
    LLMImage,
    LLMProvider,
)


class StubProvider(LLMProvider):
    name = "stub"

    def __init__(
        self,
        *,
        text: str = "",
        error: Exception | None = None,
        configured: bool = True,
    ) -> None:
        self._text = text
        self.error = error
        self._configured = configured
        self.calls: list[dict[str, Any]] = []

    @property
    def is_configured(self) -> bool:
        return self._configured

    async def generate(
        self,
        prompt: str,
        *,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        images: list[LLMImage] | None = None,
    ) -> LLMGenerationResult:
        self.calls.append(
            {
                "prompt": prompt,
                "system_instruction": system_instruction,
                "images": images,
            }
        )
        if self.error is not None:
            raise self.error
        return LLMGenerationResult(
            text=self._text,
            provider=self.name,
            model="stub-model",
        )


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def override_provider() -> Any:
    def _override(provider: LLMProvider) -> LLMProvider:
        app.dependency_overrides[get_llm_provider] = lambda: provider
        return provider

    yield _override
    app.dependency_overrides.clear()
