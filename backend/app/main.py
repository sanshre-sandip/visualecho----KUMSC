from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.config import settings
from app.routes import health_router, llm_alias_router, llm_router
from app.services.llm.base import LLMProviderError

logger = logging.getLogger("visualecho")


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    logger.info(
        "VisualEcho backend started | environment=%s | gemini_configured=%s",
        settings.environment,
        settings.gemini_configured,
    )
    yield
    logger.info("VisualEcho backend stopped")


def _safe_validation_details(errors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    details: list[dict[str, Any]] = []
    for error in errors:
        details.append(
            {
                "location": [str(part) for part in error.get("loc", ())],
                "message": str(error.get("message", "")),
                "type": str(error.get("type", "")),
            }
        )
    return details


def create_app() -> FastAPI:
    logging.basicConfig(level=logging.INFO)

    application = FastAPI(
        title="VisualEcho Backend",
        description=(
            "Secure cloud LLM gateway for the VisualEcho assistive learning app."
        ),
        version=__version__,
        lifespan=lifespan,
    )

    origins = settings.cors_origin_list
    if origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=False,
            allow_methods=["GET", "POST"],
            allow_headers=["Content-Type"],
        )

    @application.middleware("http")
    async def limit_request_size(
        request: Request,
        call_next: Any,
    ) -> JSONResponse:
        content_length = request.headers.get("content-length", "")
        if content_length.isdigit() and int(content_length) > settings.max_request_bytes:
            logger.warning(
                "rejected oversized request path=%s bytes=%s",
                request.url.path,
                content_length,
            )
            return JSONResponse(
                status_code=413,
                content={"error": "PAYLOAD_TOO_LARGE"},
            )
        return await call_next(request)

    @application.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        logger.info("validation error path=%s", request.url.path)
        return JSONResponse(
            status_code=422,
            content={
                "error": "VALIDATION_ERROR",
                "detail": _safe_validation_details(exc.errors()),
            },
        )

    @application.exception_handler(LLMProviderError)
    async def llm_provider_error_handler(
        request: Request,
        exc: LLMProviderError,
    ) -> JSONResponse:
        logger.warning(
            "LLM provider error code=%s path=%s",
            exc.code,
            request.url.path,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.code},
        )

    @application.exception_handler(Exception)
    async def unhandled_error_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.error(
            "unhandled error path=%s type=%s",
            request.url.path,
            type(exc).__name__,
            exc_info=exc,
        )
        return JSONResponse(
            status_code=500,
            content={"error": "INTERNAL_ERROR"},
        )

    application.include_router(health_router)
    application.include_router(llm_router)
    application.include_router(llm_alias_router)
    return application


app = create_app()
