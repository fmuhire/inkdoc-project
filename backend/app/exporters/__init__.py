from collections.abc import Callable
from dataclasses import dataclass


@dataclass(frozen=True)
class ExportDocument:
    title: str
    pages: list[str]
    font_size: int
    date: str | None
    page_breaks: bool


@dataclass(frozen=True)
class Exporter:
    render: Callable[[ExportDocument], bytes]
    mime: str
    ext: str


def _registry() -> dict[str, Exporter]:
    # Deferred: the exporter modules import ExportDocument from this package.
    from app.exporters import docx, pdf, text

    return {
        "docx": Exporter(
            docx.render,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "docx",
        ),
        "pdf": Exporter(pdf.render, "application/pdf", "pdf"),
        "txt": Exporter(text.render_txt, "text/plain; charset=utf-8", "txt"),
        "md": Exporter(text.render_md, "text/markdown; charset=utf-8", "md"),
        "html": Exporter(text.render_html, "text/html; charset=utf-8", "html"),
    }


EXPORTERS = _registry()
