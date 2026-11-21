import io

import pytest
from docx import Document

FORMATS = {
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pdf": "application/pdf",
    "txt": "text/plain; charset=utf-8",
    "md": "text/markdown; charset=utf-8",
    "html": "text/html; charset=utf-8",
}


def export(client, **overrides):
    body = {"title": "Lecture notes", "text": "Page one\fPage two", "format": "txt"} | overrides
    return client.post("/api/export", json=body)


@pytest.mark.parametrize(("fmt", "mime"), FORMATS.items())
def test_every_format_downloads(client, fmt, mime):
    response = export(client, format=fmt, text="Café — naïve ünïcode\fsecond")
    assert response.status_code == 200
    assert response.headers["content-type"] == mime
    assert f'filename="Lecture_notes.{fmt}"' in response.headers["content-disposition"]
    assert response.content


def test_docx_contains_title_and_pages(client):
    response = export(client, format="docx", options={"include_date": True})
    paragraphs = [p.text for p in Document(io.BytesIO(response.content)).paragraphs]
    assert paragraphs[0] == "Lecture notes"
    assert "Page one" in paragraphs and "Page two" in paragraphs


def test_pdf_is_valid_and_paginated(client):
    with_breaks = export(client, format="pdf").content
    without = export(client, format="pdf", options={"page_breaks": False}).content
    assert with_breaks.startswith(b"%PDF")
    assert with_breaks.count(b"/Type /Page\n") > without.count(b"/Type /Page\n")


def test_txt_uses_form_feed_only_with_page_breaks(client):
    assert "\f" in export(client).text
    assert "\f" not in export(client, options={"page_breaks": False}).text


def test_html_escapes_user_text(client):
    body = export(client, format="html", title="<b>t</b>", text="<script>alert(1)</script>").text
    assert "<script>" not in body and "&lt;script&gt;" in body


def test_control_characters_are_stripped(client):
    assert export(client, format="docx", text="bad\x00\x07 chars").status_code == 200


def test_unsafe_title_gives_safe_filename(client):
    header = export(client, title='../../etc/"passwd"\r\nX: y').headers["content-disposition"]
    assert 'filename="etcpasswdX_y.txt"' in header
    assert "\r" not in header and "/" not in header.split(";")[1]


@pytest.mark.parametrize(
    "overrides",
    [
        {"format": "exe"},
        {"title": "x" * 121},
        {"text": "x" * 200_001},
        {"options": {"font_size": 100}},
    ],
)
def test_invalid_requests_are_400(client, overrides):
    response = export(client, **overrides)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "bad_request"


def test_accented_title_keeps_ascii_fallback(client):
    header = export(client, title="Notes \u2013 été").headers["content-disposition"]
    assert 'filename="Notes_ete.txt"' in header
    assert "filename*=UTF-8''Notes%20%C3%A9t%C3%A9.txt" in header
