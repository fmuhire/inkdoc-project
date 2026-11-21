from pathlib import Path

from fpdf import FPDF

from app.exporters import ExportDocument

FONT_PATH = Path(__file__).resolve().parent.parent / "assets" / "DejaVuSans.ttf"
MARGIN_MM = 18
PT_TO_MM = 0.3528
LINE_SPACING = 1.4


def _line_height(size: float) -> float:
    return size * PT_TO_MM * LINE_SPACING


def render(doc: ExportDocument) -> bytes:
    pdf = FPDF(format="A4")
    pdf.set_title(doc.title)
    pdf.set_margins(MARGIN_MM, MARGIN_MM, MARGIN_MM)
    pdf.set_auto_page_break(auto=True, margin=MARGIN_MM)
    # A bundled Unicode font; the PDF core fonts only cover Latin-1.
    pdf.add_font("DejaVu", fname=str(FONT_PATH))
    pdf.add_page()

    title_size = doc.font_size + 8
    pdf.set_font("DejaVu", size=title_size)
    pdf.multi_cell(0, _line_height(title_size), doc.title, new_x="LMARGIN", new_y="NEXT")
    if doc.date:
        pdf.set_font("DejaVu", size=doc.font_size - 2)
        pdf.multi_cell(0, _line_height(doc.font_size), doc.date, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(_line_height(doc.font_size))

    pdf.set_font("DejaVu", size=doc.font_size)
    line = _line_height(doc.font_size)
    for number, page in enumerate(doc.pages):
        if number:
            if doc.page_breaks:
                pdf.add_page()
            else:
                pdf.ln(line)
        pdf.multi_cell(0, line, page, new_x="LMARGIN", new_y="NEXT")
    return bytes(pdf.output())
