import io

from docx import Document
from docx.shared import Pt

from app.exporters import ExportDocument


def render(doc: ExportDocument) -> bytes:
    word = Document()
    word.styles["Normal"].font.size = Pt(doc.font_size)
    word.add_heading(doc.title, level=1)
    if doc.date:
        word.add_paragraph().add_run(doc.date).italic = True

    for number, page in enumerate(doc.pages):
        if number and doc.page_breaks:
            word.add_page_break()
        for line in page.split("\n"):
            word.add_paragraph(line)

    out = io.BytesIO()
    word.save(out)
    return out.getvalue()
