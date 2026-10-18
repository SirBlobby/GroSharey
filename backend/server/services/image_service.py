import base64
import binascii
from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

from server.errors import BadRequestError
from server.models.profile_picture_models import MAX_PROFILE_PICTURE_BYTES

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP", "GIF", "BMP", "TIFF"}
MAX_IMAGE_DIMENSION = 1024
COMPRESSED_IMAGE_CONTENT_TYPE = "image/webp"
MAX_RECEIPT_DIMENSION = 1600
RECEIPT_IMAGE_QUALITY = 60


def decode_base64_image(image_base64: str) -> bytes:
    base64_data = image_base64.split(",", 1)[1] if image_base64.startswith("data:") else image_base64
    try:
        image_bytes = base64.b64decode(base64_data, validate=True)
    except binascii.Error:
        raise BadRequestError("Image data is not valid base64")
    if len(image_bytes) > MAX_PROFILE_PICTURE_BYTES:
        raise BadRequestError("Image must be 3 MB or smaller")
    return image_bytes


def open_image(image_bytes: bytes) -> Image.Image:
    try:
        image = Image.open(BytesIO(image_bytes))
        image.load()
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError):
        raise BadRequestError("File is not a supported image")
    if image.format not in ALLOWED_IMAGE_FORMATS:
        raise BadRequestError("Image format must be JPEG, PNG, WEBP, GIF, BMP, or TIFF")
    return image


def compress_image_losslessly(image_bytes: bytes) -> bytes:
    image = ImageOps.exif_transpose(open_image(image_bytes))
    image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION))
    target_mode = "RGBA" if image.mode in ("RGBA", "LA", "P") else "RGB"
    output_buffer = BytesIO()
    image.convert(target_mode).save(output_buffer, format="WEBP", lossless=True, quality=100, method=6)
    return output_buffer.getvalue()


def compress_receipt_image(image_bytes: bytes) -> bytes:
    image = ImageOps.exif_transpose(open_image(image_bytes))
    image.thumbnail((MAX_RECEIPT_DIMENSION, MAX_RECEIPT_DIMENSION))
    output_buffer = BytesIO()
    image.convert("L").save(output_buffer, format="WEBP", quality=RECEIPT_IMAGE_QUALITY, method=6)
    return output_buffer.getvalue()
