import io

from PIL import Image, ImageOps, UnidentifiedImageError

from app.errors import BadInput

ACCEPTED_FORMATS = ("JPEG", "PNG", "WEBP", "BMP", "TIFF", "GIF")
MAX_SIDE = 2000


def preprocess(data: bytes, filename: str) -> bytes:
    """Validate an upload as a real image and normalise it for handwriting OCR."""
    try:
        with Image.open(io.BytesIO(data), formats=ACCEPTED_FORMATS) as probe:
            probe.verify()
        # verify() leaves the image unusable, so decode a fresh copy.
        image = Image.open(io.BytesIO(data), formats=ACCEPTED_FORMATS)
        image.load()
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError) as exc:
        raise BadInput(f"{filename} is not a supported image (use JPG, PNG or WEBP).") from exc

    image = ImageOps.exif_transpose(image)
    image = ImageOps.autocontrast(image.convert("L"), cutoff=1)
    image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)

    out = io.BytesIO()
    image.save(out, format="JPEG", quality=90, optimize=True)
    return out.getvalue()
