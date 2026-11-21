import httpx

from tests.conftest import TEST_KEY, make_client, make_image


def upload(client, *images, headers=None):
    files = [("images", (f"page{i}.png", data, "image/png")) for i, data in enumerate(images)]
    return client.post("/api/ocr", files=files, headers=headers or {})


def test_success_returns_text_and_word_count(client, ocr_api, image):
    ocr_api.respond(json={"value": " Hello handwritten world "})
    body = upload(client, image).json()
    assert body["server"]
    assert body["pages"] == [
        {
            "index": 0,
            "filename": "page0.png",
            "text": "Hello handwritten world",
            "words": 3,
            "cached": False,
        }
    ]
    request = ocr_api.calls.last.request
    assert request.headers["X-RapidAPI-Key"] == TEST_KEY
    assert b'name="srcImg"' in request.content
    assert b'name="Session"' in request.content


def test_falls_back_to_result_field(client, ocr_api, image):
    ocr_api.respond(json={"result": "from result"})
    assert upload(client, image).json()["pages"][0]["text"] == "from result"


def test_empty_text_is_not_an_error(client, ocr_api, image):
    ocr_api.respond(json={"value": ""})
    page = upload(client, image).json()["pages"][0]
    assert page["text"] == "" and page["words"] == 0 and "error" not in page


def test_repeat_image_is_served_from_cache(client, ocr_api, image):
    ocr_api.respond(json={"value": "cached text"})
    upload(client, image)
    page = upload(client, image).json()["pages"][0]
    assert page["cached"] is True
    assert ocr_api.call_count == 1


def test_retries_once_on_server_error(client, ocr_api, image):
    ocr_api.side_effect = [httpx.Response(503), httpx.Response(200, json={"value": "ok"})]
    assert upload(client, image).json()["pages"][0]["text"] == "ok"
    assert ocr_api.call_count == 2


def test_timeout_after_retry_maps_to_504(client, ocr_api, image):
    ocr_api.side_effect = httpx.ReadTimeout("slow")
    response = upload(client, image)
    assert response.status_code == 504
    assert response.json()["error"]["message"] == "OCR service temporarily unavailable"
    assert ocr_api.call_count == 2


def test_network_error_maps_to_502(client, ocr_api, image):
    ocr_api.side_effect = httpx.ConnectError("down")
    assert upload(client, image).status_code == 502


def test_quota_maps_to_429_and_stops_calling(client, ocr_api):
    ocr_api.respond(429, text="upstream quota body")
    response = upload(client, make_image(color=(1, 1, 1)), make_image(color=(9, 9, 9)))
    assert response.status_code == 429
    assert response.json() == {
        "error": {"code": "ocr_quota_exceeded", "message": "Daily OCR limit reached"}
    }
    assert ocr_api.call_count == 1


def test_rejected_key_maps_to_503_without_leaking(client, ocr_api, image):
    ocr_api.respond(403, json={"message": "You are not subscribed", "key": TEST_KEY})
    response = upload(client, image)
    assert response.status_code == 503
    assert response.json()["error"]["message"] == "OCR service not configured"
    assert TEST_KEY not in response.text and "subscribed" not in response.text


def test_missing_key_skips_upstream(ocr_api, image):
    with make_client(rapidapi_key="") as client:
        assert upload(client, image).status_code == 503
    assert ocr_api.call_count == 0


def test_partial_failure_keeps_successful_pages(client, ocr_api):
    ocr_api.side_effect = [
        httpx.Response(200, json={"value": "first"}),
        httpx.Response(500),
        httpx.Response(500),
    ]
    response = upload(client, make_image(color=(1, 1, 1)), make_image(color=(9, 9, 9)))
    assert response.status_code == 200
    first, second = response.json()["pages"]
    assert first["text"] == "first"
    assert second["error"]["code"] == "ocr_unavailable"


def test_rejects_non_image_upload(client, ocr_api):
    response = upload(client, b"plain text pretending")
    assert response.status_code == 400
    assert "page0.png" in response.json()["error"]["message"]
    assert ocr_api.call_count == 0


def test_rejects_oversized_upload(ocr_api):
    with make_client(max_file_mb=1) as client:
        response = upload(client, make_image(size=(3000, 3000), fmt="BMP"))
    assert response.status_code == 413


def test_rejects_too_many_files(client, image):
    assert upload(client, *[image] * 11).status_code == 400


def test_rejects_missing_files(client):
    assert client.post("/api/ocr").status_code == 400


def test_rate_limit_is_per_forwarded_client(monkeypatch, ocr_api, image):
    monkeypatch.setenv("RATE_LIMIT", "2/minute")
    from app.config import get_settings

    get_settings.cache_clear()
    ocr_api.respond(json={"value": "x"})
    try:
        with make_client() as client:
            alice = {"X-Forwarded-For": "203.0.113.5, 10.0.0.1"}
            bob = {"X-Forwarded-For": "198.51.100.7, 10.0.0.1"}
            assert [upload(client, image, headers=alice).status_code for _ in range(3)] == [
                200,
                200,
                429,
            ]
            assert upload(client, image, headers=bob).status_code == 200
            spoofed = {"X-Forwarded-For": "1.2.3.4, 203.0.113.5, 10.0.0.1"}
            limited = upload(client, image, headers=spoofed)
            assert limited.json()["error"]["code"] == "rate_limited"
    finally:
        get_settings.cache_clear()
