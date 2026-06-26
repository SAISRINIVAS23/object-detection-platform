from fastapi import APIRouter, Depends, HTTPException, status
from collections import Counter
from datetime import datetime

from app.database.deps import supabase, get_current_user

router = APIRouter()

@router.get("/stats")
def stats(
    current_user: dict = Depends(get_current_user)
):
    try:
        response = (
            supabase.table("detections")
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        user_detections = response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {str(e)}"
        )

    total_uploads = len(user_detections)
    total_items_detected = 0
    object_counter = Counter()
    unique_dates = set()

    images_processed = 0
    videos_processed = 0
    screenshots_saved = 0

    for d in user_detections:
        dets = d.get("detections") or []
        total_items_detected += len(dets)
        for item in dets:
            obj_name = item.get("object", "unknown")
            object_counter[obj_name] += 1
        
        # Track unique days
        created_at_str = d.get("created_at")
        if created_at_str:
            try:
                dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                unique_dates.add(dt.date())
            except Exception:
                pass

        # Classify the detection type
        img_name = d.get("image_name") or ""
        proc_img = d.get("processed_image") or ""

        if img_name.startswith("webcam_"):
            screenshots_saved += 1
        elif "/processed/videos/" in proc_img:
            videos_processed += 1
        elif "/processed/images/" in proc_img:
            images_processed += 1

    # Format recent activity (last 5 detections)
    recent_activity = []
    for d in user_detections[:5]:
        filename = d.get("image_name")
        proc_img_path = d.get("processed_image")
        
        # Build cloud public URL redirect endpoint to fetch from Supabase
        # We redirect users through backend proxy/redirect URL so the frontend stays clean
        recent_activity.append({
            "id": d.get("id"),
            "image_name": filename,
            "processed_image": f"http://127.0.0.1:8000{proc_img_path}" if proc_img_path else None,
            "detections": dets,
            "created_at": created_at_str
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