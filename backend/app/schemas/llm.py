from __future__ import annotations

import base64
import binascii
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Difficulty = Literal["easy", "medium", "hard"]
DrawingMimeType = Literal["image/png", "image/jpeg", "image/webp"]

MAX_TOPIC_LENGTH = 64
MAX_TARGET_WORD_LENGTH = 64
MAX_TRANSCRIPT_LENGTH = 500
MAX_WORDS_COUNT = 10
MAX_DRAWING_BASE64_LENGTH = 5_000_000


class _StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class GenerateWordsRequest(_StrictModel):
    topic: str = Field(min_length=1, max_length=MAX_TOPIC_LENGTH)
    difficulty: Difficulty = "easy"
    count: int = Field(default=5, ge=1, le=MAX_WORDS_COUNT)


class GenerateWordsResponse(BaseModel):
    topic: str
    difficulty: Difficulty
    words: list[str] = Field(min_length=1, max_length=MAX_WORDS_COUNT)
    provider: str
    model: str


class SpeechEvaluationRequest(_StrictModel):
    target_word: str = Field(min_length=1, max_length=MAX_TARGET_WORD_LENGTH)
    transcript: str = Field(min_length=1, max_length=MAX_TRANSCRIPT_LENGTH)


class SpeechEvaluationResponse(BaseModel):
    correct: bool
    target_word: str
    transcript: str
    feedback: str = Field(min_length=1, max_length=400)
    provider: str
    model: str


class DrawingAnalysisRequest(_StrictModel):
    mime_type: DrawingMimeType = "image/png"
    image_base64: str = Field(max_length=MAX_DRAWING_BASE64_LENGTH)

    @field_validator("image_base64")
    @classmethod
    def _valid_base64(cls, value: str) -> str:
        if not value:
            raise ValueError("image_base64 must not be blank")
        try:
            decoded = base64.b64decode(value, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("image_base64 must be valid base64") from exc
        if not decoded:
            raise ValueError("image_base64 must decode to a non-empty image")
        return value


class DrawingAnalysisResponse(BaseModel):
    description: str = Field(min_length=1, max_length=2000)
    feedback: str = Field(min_length=1, max_length=400)
    provider: str
    model: str


class ErrorResponse(BaseModel):
    error: str
    detail: list[dict] | None = None
