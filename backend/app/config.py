from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

VERSION = "1.0.0"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    rapidapi_key: SecretStr = SecretStr("")
    rapidapi_host: str = "pen-to-print-handwriting-ocr.p.rapidapi.com"
    ocr_timeout: float = 30.0
    cache_ttl: int = 24 * 60 * 60
    cache_size: int = 1024
    max_files: int = 10
    max_file_mb: int = 10
    rate_limit: str = "30/15 minutes"
    # Proxies in front of the app that append to X-Forwarded-For (HAProxy, then nginx).
    trusted_proxy_hops: int = 2
    cors_origins: list[str] = ["http://localhost:5173"]

    @property
    def ocr_configured(self) -> bool:
        return bool(self.rapidapi_key.get_secret_value().strip())

    @property
    def ocr_url(self) -> str:
        return f"https://{self.rapidapi_host}/recognize/"


@lru_cache
def get_settings() -> Settings:
    return Settings()
