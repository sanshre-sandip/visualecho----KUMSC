from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.config import settings
from app.routes import health_router, llm_router
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

    application.include_router(health_router)
    application.include_router(llm_router)
    return application


app = create_app()
