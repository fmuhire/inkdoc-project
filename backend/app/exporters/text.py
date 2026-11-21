import html

from app.exporters import ExportDocument


def render_txt(doc: ExportDocument) -> bytes:
    header = [doc.title, doc.date] if doc.date else [doc.title]
    separator = "\n\f\n" if doc.page_breaks else "\n\n"
    return ("\n".join(header) + "\n\n" + separator.join(doc.pages) + "\n").encode()


def render_md(doc: ExportDocument) -> bytes:
    header = f"# {doc.title}\n\n" + (f"_{doc.date}_\n\n" if doc.date else "")
    separator = "\n\n---\n\n" if doc.page_breaks else "\n\n"
    return (header + separator.join(doc.pages) + "\n").encode()


def _html_page(page: str) -> str:
    blocks = [block for block in page.split("\n\n") if block.strip()]
    paragraphs = ("<p>" + html.escape(block).replace("\n", "<br>\n") + "</p>" for block in blocks)
    return "<section>\n" + "\n".join(paragraphs) + "\n</section>"


def render_html(doc: ExportDocument) -> bytes:
    title = html.escape(doc.title)
    date = f'<p class="date">{html.escape(doc.date)}</p>\n' if doc.date else ""
    break_rule = "section + section { break-before: page; }" if doc.page_breaks else ""
    body = "\n".join(_html_page(page) for page in doc.pages)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
body {{ font-family: Georgia, serif; font-size: {doc.font_size}pt; line-height: 1.5;
       max-width: 42rem; margin: 2rem auto; padding: 0 1rem; color: #1f2937; }}
.date {{ color: #6b7280; font-style: italic; }}
{break_rule}
</style>
</head>
<body>
<h1>{title}</h1>
{date}{body}
</body>
</html>
""".encode()
