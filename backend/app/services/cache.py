import hashlib

from cachetools import TTLCache


class OcrCache:
    def __init__(self, maxsize: int, ttl: int) -> None:
        self._store: TTLCache[str, str] = TTLCache(maxsize=maxsize, ttl=ttl)

    @staticmethod
    def key_for(image: bytes) -> str:
        return hashlib.sha256(image).hexdigest()

    def get(self, key: str) -> str | None:
        return self._store.get(key)

    def put(self, key: str, text: str) -> None:
        self._store[key] = text
