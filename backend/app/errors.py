import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    status = 500
    code = "internal_error"
    message = "Something went wrong."

    def __init__(self, message: str | None = None) -> None:
        self.message = message or type(self).message
        super().__init__(self.message)


class BadInput(AppError):
    status = 400
    code = "bad_request"
    message = "The request was invalid."


class PayloadTooLarge(AppError):
    status = 413
    code = "payload_too_large"
    message = "The upload is too large."


class OcrNotConfigured(AppError):
    status = 503
    code = "ocr_not_configured"
    message = "OCR service not configured"


class OcrQuotaExceeded(AppError):
    status = 429
    code = "ocr_quota_exceeded"
    message = "Daily OCR limit reached"


class OcrUnavailable(AppError):
    status = 502
    code = "ocr_unavailable"
    message = "OCR service temporarily unavailable"


class OcrTimeout(OcrUnavailable):
    status = 504
    code = "ocr_timeout"


def error_body(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def _json(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(error_body(code, message), status_code=status)


def _validation_message(exc: RequestValidationError) -> str:
    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(part) for part in first.get("loc", ()) if part not in ("body", "query"))
    detail = first.get("msg", "Invalid input")
    return f"{field}: {detail}" if field else detail


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error(_: Request, exc: AppError) -> JSONResponse:
        return _json(exc.status, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return _json(400, BadInput.code, _validation_message(exc))

    @app.exception_handler(RateLimitExceeded)
    async def rate_limited(_: Request, __: RateLimitExceeded) -> JSONResponse:
        return _json(429, "rate_limited", "Too many requests. Please wait a few minutes.")

    @app.exception_handler(HTTPException)
    async def http_error(_: Request, exc: HTTPException) -> JSONResponse:
        code = "not_found" if exc.status_code == 404 else "http_error"
        return _json(exc.status_code, code, str(exc.detail))

    @app.exception_handler(Exception)
    async def unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error", exc_info=exc)
        return _json(500, AppError.code, AppError.message)
