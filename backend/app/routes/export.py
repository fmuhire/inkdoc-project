import re
from datetime import date
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, Response
from pydantic import BaseModel, Field

from app.exporters import EXPORTERS, ExportDocument

PAGE_SEPARATOR = "\f"
# XML-illegal control characters break DOCX; keep \t and \n.
CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

router = APIRouter(prefix="/api")


class ExportOptions(BaseModel):
    font_size: int = Field(12, ge=8, le=32)
    include_date: bool = False
    page_breaks: bool = True


class ExportRequest(BaseModel):
    title: str = Field("Untitled document", max_length=120)
    text: str = Field(max_length=200_000)
    format: Literal["docx", "pdf", "txt", "md", "html"]
    options: ExportOptions = ExportOptions()


def content_disposition(title: str, ext: str) -> str:
    stem = re.sub(r"[^\w\- ]+", "", title).strip() or "inkdoc"
    ascii_stem = re.sub(r"\s+", "_", stem.encode("ascii", "ignore").decode()).strip("_") or "inkdoc"
    return f"attachment; filename=\"{ascii_stem}.{ext}\"; filename*=UTF-8''{quote(stem)}.{ext}"


@router.post("/export")
def export(body: ExportRequest) -> Response:
    exporter = EXPORTERS[body.format]
    text = body.text.replace("\r\n", "\n").replace("\r", "\n")
    title = CONTROL_CHARS.sub("", body.title).strip() or "Untitled document"
    document = ExportDocument(
        title=title,
        pages=[CONTROL_CHARS.sub("", page).strip("\n") for page in text.split(PAGE_SEPARATOR)],
        font_size=body.options.font_size,
        date=date.today().strftime("%d %B %Y") if body.options.include_date else None,
        page_breaks=body.options.page_breaks,
    )
    return Response(
        content=exporter.render(document),
        media_type=exporter.mime,
        headers={"Content-Disposition": content_disposition(title, exporter.ext)},
    )
