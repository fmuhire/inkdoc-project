import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import VERSION, Settings, get_settings
from app.errors import register_error_handlers
from app.routes import export, health, ocr
from app.services.cache import OcrCache
from app.services.ocr_client import OcrClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        async with httpx.AsyncClient() as http:
            cache = OcrCache(settings.cache_size, settings.cache_ttl)
            app.state.ocr = OcrClient(http, settings, cache)
            yield

    # Static files are served by nginx in production, so the app exposes only /api.
    app = FastAPI(
        title="InkDoc API",
        version=VERSION,
        lifespan=lifespan,
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
    )
    app.state.settings = settings
    app.state.limiter = ocr.limiter

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_methods=["GET", "POST"],
            allow_headers=["Content-Type"],
            expose_headers=["Content-Disposition"],
        )
    register_error_handlers(app)
    for module in (health, ocr, export):
        app.include_router(module.router)
    return app


app = create_app()
