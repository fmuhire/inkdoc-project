import io

import pytest
from PIL import Image

from app.errors import BadInput
from app.services.image import MAX_SIDE, preprocess
from tests.conftest import make_image

EXIF_ORIENTATION = 0x0112
ROTATED_90_CW = 6


def test_output_is_greyscale_jpeg_within_bounds():
    result = Image.open(io.BytesIO(preprocess(make_image((4000, 1000)), "a.png")))
    assert result.format == "JPEG"
    assert result.mode == "L"
    assert max(result.size) == MAX_SIDE


def test_exif_orientation_is_applied():
    source = Image.new("RGB", (400, 200))
    exif = source.getexif()
    exif[EXIF_ORIENTATION] = ROTATED_90_CW
    out = io.BytesIO()
    source.save(out, format="JPEG", exif=exif)
    assert Image.open(io.BytesIO(preprocess(out.getvalue(), "r.jpg"))).size == (200, 400)


@pytest.mark.parametrize("data", [b"not an image", b"%PDF-1.4 fake", make_image()[:40]])
def test_rejects_non_images(data):
    with pytest.raises(BadInput, match=r"x\.png"):
        preprocess(data, "x.png")
