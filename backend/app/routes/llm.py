from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_ai_service
from app.schemas.llm import (
    DrawingAnalysisRequest,
    DrawingAnalysisResponse,
    GenerateWordsRequest,
    GenerateWordsResponse,
    SpeechEvaluationRequest,
    SpeechEvaluationResponse,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/v1/llm", tags=["llm"])
alias_router = APIRouter(prefix="/api/llm", tags=["llm"])


@router.post(
    "/generate-words",
    response_model=GenerateWordsResponse,
    summary="Generate practice words with the cloud LLM",
)
@alias_router.post(
    "/generate-words",
    response_model=GenerateWordsResponse,
    include_in_schema=False,
)
async def generate_words(
    body: GenerateWordsRequest,
    service: AIService = Depends(get_ai_service),
) -> GenerateWordsResponse:
    return await service.generate_words(body)


@router.post(
    "/evaluate-speech",
    response_model=SpeechEvaluationResponse,
    summary="Evaluate a local STT transcript with the cloud LLM",
)
@alias_router.post(
    "/evaluate-speech",
    response_model=SpeechEvaluationResponse,
    include_in_schema=False,
)
async def evaluate_speech(
    body: SpeechEvaluationRequest,
    service: AIService = Depends(get_ai_service),
) -> SpeechEvaluationResponse:
    return await service.evaluate_speech(body)


@router.post(
    "/analyze-drawing",
    response_model=DrawingAnalysisResponse,
    summary="Analyze a drawing image with the cloud LLM",
)
@alias_router.post(
    "/analyze-drawing",
    response_model=DrawingAnalysisResponse,
    include_in_schema=False,
)
async def analyze_drawing(
    body: DrawingAnalysisRequest,
    service: AIService = Depends(get_ai_service),
) -> DrawingAnalysisResponse:
    return await service.analyze_drawing(body)
