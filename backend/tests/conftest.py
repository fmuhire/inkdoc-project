import io

import pytest
import respx
from fastapi.testclient import TestClient
from PIL import Image

from app.config import Settings
from app.main import create_app
from app.routes.ocr import limiter

OCR_URL = "https://pen-to-print-handwriting-ocr.p.rapidapi.com/recognize/"
TEST_KEY = "test-secret-key-123"


def make_image(size=(800, 600), color=(240, 240, 240), fmt="PNG") -> bytes:
    out = io.BytesIO()
    Image.new("RGB", size, color).save(out, format=fmt)
    return out.getvalue()


def make_client(**overrides) -> TestClient:
    settings = Settings(**({"_env_file": None, "rapidapi_key": TEST_KEY} | overrides))
    return TestClient(create_app(settings))


@pytest.fixture(autouse=True)
def reset_rate_limits():
    limiter.reset()


@pytest.fixture
def client():
    with make_client() as test_client:
        yield test_client


@pytest.fixture
def ocr_api():
    with respx.mock(assert_all_called=False) as router:
        yield router.post(OCR_URL)


@pytest.fixture
def image() -> bytes:
    return make_image()
