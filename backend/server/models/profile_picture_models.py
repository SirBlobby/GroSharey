from pydantic import BaseModel, Field

MAX_PROFILE_PICTURE_BYTES = 3 * 1024 * 1024
MAX_BASE64_LENGTH = (MAX_PROFILE_PICTURE_BYTES * 4) // 3 + 4


class ProfilePictureUpload(BaseModel):
    image_base64: str = Field(min_length=1, max_length=MAX_BASE64_LENGTH)
