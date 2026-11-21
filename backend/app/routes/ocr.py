import socket
from typing import Annotated

from fastapi import APIRouter, File, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from slowapi import Limiter

from app.config import get_settings
from app.errors import AppError, BadInput, OcrNotConfigured, OcrQuotaExceeded, PayloadTooLarge
from app.services.image import preprocess
from app.services.ocr_client import OcrClient

# Errors that will repeat for every remaining page, so we stop calling the API.
FATAL_ERRORS = (OcrNotConfigured, OcrQuotaExceeded)


def client_ip(request: Request) -> str:
    forwarded = [ip.strip() for ip in request.headers.get("x-forwarded-for", "").split(",")]
    forwarded = [ip for ip in forwarded if ip]
    if not forwarded:
        return request.client.host if request.client else "unknown"
    # Entries left of the one our first trusted proxy appended are client-controlled.
    hops = get_settings().trusted_proxy_hops
    return forwarded[max(len(forwarded) - hops, 0)]


limiter = Limiter(key_func=client_ip)
router = APIRouter(prefix="/api")


class PageError(BaseModel):
    code: str
    message: str


class Page(BaseModel):
    index: int
    filename: str
    text: str = ""
    words: int = 0
    cached: bool = False
    error: PageError | None = None


class OcrResponse(BaseModel):
    pages: list[Page]
    server: str


async def _read_validated(upload: UploadFile, max_mb: int) -> bytes:
    name = upload.filename or "image"
    data = await upload.read(max_mb * 1024 * 1024 + 1)
    if len(data) > max_mb * 1024 * 1024:
        raise PayloadTooLarge(f"{name} is larger than {max_mb} MB.")
    if not data:
        raise BadInput(f"{name} is empty.")
    return await run_in_threadpool(preprocess, data, name)


def _failed(index: int, filename: str, exc: AppError) -> Page:
    return Page(index=index, filename=filename, error=PageError(code=exc.code, message=exc.message))


@router.post("/ocr", response_model=OcrResponse, response_model_exclude_none=True)
@limiter.limit(lambda: get_settings().rate_limit)
async def recognize(request: Request, images: Annotated[list[UploadFile], File()]) -> OcrResponse:
    settings = request.app.state.settings
    if not 1 <= len(images) <= settings.max_files:
        raise BadInput(f"Upload between 1 and {settings.max_files} images.")

    names = [(upload.filename or f"page-{i + 1}")[:255] for i, upload in enumerate(images)]
    processed = [await _read_validated(upload, settings.max_file_mb) for upload in images]

    ocr: OcrClient = request.app.state.ocr
    pages: list[Page] = []
    errors: list[AppError] = []
    for index, (name, image) in enumerate(zip(names, processed, strict=True)):
        fatal = next((e for e in errors if isinstance(e, FATAL_ERRORS)), None)
        if fatal:
            pages.append(_failed(index, name, fatal))
            continue
        try:
            text, cached = await ocr.recognize(image)
        except AppError as exc:
            errors.append(exc)
            pages.append(_failed(index, name, exc))
            continue
        pages.append(
            Page(index=index, filename=name, text=text, words=len(text.split()), cached=cached)
        )

    if all(page.error for page in pages):
        raise errors[0]
    return OcrResponse(pages=pages, server=socket.gethostname())
