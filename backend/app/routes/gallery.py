from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.deps import get_db, get_current_user
from app.models.detection import Detection
from app.models.user import User
from app.schemas.detection import DetectionResponse

router = APIRouter()

@router.get("/", response_model=List[DetectionResponse])
def gallery(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all user detections, sorted by creation date descending
    data = (
        db.query(Detection)
        .filter(Detection.user_id == current_user.id)
        .order_by(Detection.created_at.desc())
        .all()
    )
    return data