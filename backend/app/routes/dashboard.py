from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import Counter
from datetime import datetime

from app.database.deps import get_db, get_current_user
from app.models.detection import Detection
from app.models.user import User

router = APIRouter()

@router.get("/stats")
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all user detections
    user_detections = (
        db.query(Detection)
        .filter(Detection.user_id == current_user.id)
        .order_by(Detection.created_at.desc())
        .all()
    )

    total_uploads = len(user_detections)
    total_items_detected = 0
    object_counter = Counter()
    unique_dates = set()

    # Detailed counts matching the dashboard cards
    images_processed = 0
    videos_processed = 0
    screenshots_saved = 0

    for d in user_detections:
        dets = d.detections or []
        total_items_detected += len(dets)
        for item in dets:
            obj_name = item.get("object", "unknown")
            object_counter[obj_name] += 1
        
        # Track unique days
        if d.created_at:
            unique_dates.add(d.created_at.date())

        # Classify the detection type
        img_name = d.image_name or ""
        proc_img = d.processed_image or ""

        if img_name.startswith("webcam_"):
            screenshots_saved += 1
        elif "/processed/videos/" in proc_img:
            videos_processed += 1
        elif "/processed/images/" in proc_img:
            images_processed += 1

    # Format recent activity (last 5 detections)
    recent_activity = []
    for d in user_detections[:5]:
        recent_activity.append({
            "id": d.id,
            "image_name": d.image_name,
            "processed_image": f"http://127.0.0.1:8000{d.processed_image}" if d.processed_image else None,
            "detections": d.detections,
            "created_at": d.created_at.isoformat() if d.created_at else None
        })

    return {
        "total_detections": total_uploads,
        "images_processed": images_processed,
        "videos_processed": videos_processed,
        "screenshots_saved": screenshots_saved,
        "total_items_detected": total_items_detected,
        "object_counts": dict(object_counter.most_common(10)),
        "active_days": len(unique_dates),
        "recent_detections": recent_activity
    }