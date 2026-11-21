import socket

from fastapi import APIRouter, Request

from app.config import VERSION

router = APIRouter(prefix="/api")


@router.get("/health")
async def health(request: Request) -> dict:
    return {
        "status": "ok",
        "server": socket.gethostname(),
        "ocr_configured": request.app.state.settings.ocr_configured,
        "version": VERSION,
    }
