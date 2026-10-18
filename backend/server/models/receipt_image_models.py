from pydantic import BaseModel


class StoredReceiptImage(BaseModel):
    id: str
    owner_id: str
    image_data: bytes
    content_type: str


class ReceiptImage(BaseModel):
    id: str
    image_data_url: str
