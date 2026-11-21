from tests.conftest import make_client


def test_health_reports_status(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["ocr_configured"] is True
    assert body["server"]
    assert body["version"]


def test_health_without_key():
    with make_client(rapidapi_key="") as client:
        assert client.get("/api/health").json()["ocr_configured"] is False


def test_unknown_route_uses_error_shape(client):
    response = client.get("/api/nope")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
