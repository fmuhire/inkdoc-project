import logging

import httpx

from app.config import Settings
from app.errors import OcrNotConfigured, OcrQuotaExceeded, OcrTimeout, OcrUnavailable
from app.services.cache import OcrCache

logger = logging.getLogger(__name__)

ATTEMPTS = 2


class OcrClient:
    def __init__(self, http: httpx.AsyncClient, settings: Settings, cache: OcrCache) -> None:
        self._http = http
        self._settings = settings
        self._cache = cache

    async def recognize(self, image: bytes) -> tuple[str, bool]:
        """Return (text, cached) for a preprocessed JPEG."""
        key = self._cache.key_for(image)
        hit = self._cache.get(key)
        if hit is not None:
            return hit, True
        text = await self._request(image)
        self._cache.put(key, text)
        return text, False

    async def _request(self, image: bytes) -> str:
        if not self._settings.ocr_configured:
            raise OcrNotConfigured()
        headers = {
            "X-RapidAPI-Key": self._settings.rapidapi_key.get_secret_value(),
            "X-RapidAPI-Host": self._settings.rapidapi_host,
        }
        for attempt in range(1, ATTEMPTS + 1):
            final = attempt == ATTEMPTS
            try:
                response = await self._http.post(
                    self._settings.ocr_url,
                    headers=headers,
                    files={"srcImg": ("page.jpg", image, "image/jpeg")},
                    data={"Session": "string"},
                    timeout=self._settings.ocr_timeout,
                )
            except httpx.TimeoutException as exc:
                logger.warning("OCR request timed out (attempt %d)", attempt)
                if final:
                    raise OcrTimeout() from exc
                continue
            except httpx.TransportError as exc:
                logger.warning("OCR network error (attempt %d): %s", attempt, type(exc).__name__)
                if final:
                    raise OcrUnavailable() from exc
                continue
            if response.status_code >= 500 and not final:
                logger.warning("OCR upstream %d, retrying", response.status_code)
                continue
            return _parse(response)
        raise OcrUnavailable()


def _parse(response: httpx.Response) -> str:
    status = response.status_code
    if status in (401, 403):
        logger.error("OCR upstream rejected the API key (%d)", status)
        raise OcrNotConfigured()
    if status == 429:
        raise OcrQuotaExceeded()
    if status >= 400:
        logger.warning("OCR upstream returned %d", status)
        raise OcrUnavailable()
    try:
        payload = response.json()
    except ValueError as exc:
        raise OcrUnavailable() from exc
    text = (payload.get("value") or payload.get("result")) if isinstance(payload, dict) else None
    return text.strip() if isinstance(text, str) else ""
