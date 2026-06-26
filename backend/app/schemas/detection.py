from pydantic import BaseModel
from typing import List
from datetime import datetime

class DetectionItem(BaseModel):
    object: str
    confidence: float

class DetectionResponse(BaseModel):
    id: int
    user_id: int
    image_name: str
    processed_image: str
    detections: List[DetectionItem]
    created_at: datetime

    class Config:
        from_attributes = True
