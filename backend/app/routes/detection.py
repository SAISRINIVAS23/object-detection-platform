import os
import uuid
import base64
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.ai.detector import detect_image, detect_video, detect_frame
from app.database.deps import get_db, get_current_user
from app.models.detection import Detection
from app.models.user import User

router = APIRouter()

UPLOAD_IMG_DIR = "app/uploads/images"
PROCESSED_IMG_DIR = "app/processed/images"
UPLOAD_VID_DIR = "app/uploads/videos"
PROCESSED_VID_DIR = "app/processed/videos"

class FrameRequest(BaseModel):
    frame: str  # Base64 data string (JPEG)
    conf: float = 0.25

@router.post("/image")
async def detect_image_api(
    file: UploadFile = File(...),
    conf: float = Query(0.25, ge=0.1, le=1.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    os.makedirs(UPLOAD_IMG_DIR, exist_ok=True)
    os.makedirs(PROCESSED_IMG_DIR, exist_ok=True)

    extension = os.path.splitext(file.filename)[1]
    filename = (
        datetime.now().strftime("%Y%m%d_%H%M%S_")
        + str(uuid.uuid4())[:8]
        + extension
    )

    upload_path = os.path.join(UPLOAD_IMG_DIR, filename)
    processed_path = os.path.join(PROCESSED_IMG_DIR, filename)

    try:
        content = await file.read()
        with open(upload_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save uploaded image: {str(e)}"
        )

    try:
        detections = detect_image(upload_path, processed_path, conf=conf)
    except Exception as e:
        if os.path.exists(upload_path):
            os.remove(upload_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running object detection: {str(e)}"
        )

    db_detection = Detection(
        user_id=current_user.id,
        image_name=filename,
        processed_image=f"/processed/images/{filename}",
        detections=detections
    )
    db.add(db_detection)
    db.commit()
    db.refresh(db_detection)

    return {
        "success": True,
        "message": "Detection completed",
        "filename": filename,
        "processed_image": f"http://127.0.0.1:8000/processed/images/{filename}",
        "detections": detections
    }

@router.post("/video")
async def detect_video_api(
    file: UploadFile = File(...),
    conf: float = Query(0.25, ge=0.1, le=1.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    os.makedirs(UPLOAD_VID_DIR, exist_ok=True)
    os.makedirs(PROCESSED_VID_DIR, exist_ok=True)

    extension = os.path.splitext(file.filename)[1]
    filename = (
        datetime.now().strftime("%Y%m%d_%H%M%S_")
        + str(uuid.uuid4())[:8]
        + extension
    )

    upload_path = os.path.join(UPLOAD_VID_DIR, filename)
    processed_path = os.path.join(PROCESSED_VID_DIR, filename)

    try:
        content = await file.read()
        with open(upload_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save uploaded video: {str(e)}"
        )

    try:
        detections = detect_video(upload_path, processed_path, conf=conf)
    except Exception as e:
        if os.path.exists(upload_path):
            os.remove(upload_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running object detection on video: {str(e)}"
        )

    db_detection = Detection(
        user_id=current_user.id,
        image_name=filename,
        processed_image=f"/processed/videos/{filename}",
        detections=detections
    )
    db.add(db_detection)
    db.commit()
    db.refresh(db_detection)

    return {
        "success": True,
        "message": "Video detection completed",
        "filename": filename,
        "processed_video": f"http://127.0.0.1:8000/processed/videos/{filename}",
        "detections": detections
    }

@router.post("/frame")
def detect_frame_api(
    request: FrameRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        header, encoded = request.frame.split(",", 1)
    except ValueError:
        encoded = request.frame

    try:
        image_bytes = base64.b64decode(encoded)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid base64 encoding: {str(e)}"
        )

    try:
        detections, annotated_base64 = detect_frame(image_bytes, conf=request.conf)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webcam frame detection failed: {str(e)}"
        )

    return {
        "success": True,
        "detections": detections,
        "annotated_frame": f"data:image/jpeg;base64,{annotated_base64}"
    }

@router.post("/webcam")
def detect_webcam_save_api(
    request: FrameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    os.makedirs(UPLOAD_IMG_DIR, exist_ok=True)
    os.makedirs(PROCESSED_IMG_DIR, exist_ok=True)

    try:
        header, encoded = request.frame.split(",", 1)
    except ValueError:
        encoded = request.frame

    try:
        image_bytes = base64.b64decode(encoded)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid base64 encoding: {str(e)}"
        )

    # Generate filename with webcam prefix
    filename = f"webcam_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}.jpg"
    upload_path = os.path.join(UPLOAD_IMG_DIR, filename)
    processed_path = os.path.join(PROCESSED_IMG_DIR, filename)

    try:
        # Save raw frame
        with open(upload_path, "wb") as buffer:
            buffer.write(image_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save webcam frame: {str(e)}"
        )

    try:
        detections = detect_image(upload_path, processed_path, conf=request.conf)
    except Exception as e:
        if os.path.exists(upload_path):
            os.remove(upload_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing webcam frame: {str(e)}"
        )

    db_detection = Detection(
        user_id=current_user.id,
        image_name=filename,
        processed_image=f"/processed/images/{filename}",
        detections=detections
    )
    db.add(db_detection)
    db.commit()
    db.refresh(db_detection)

    return {
        "success": True,
        "message": "Webcam frame saved successfully",
        "filename": filename,
        "processed_image": f"http://127.0.0.1:8000/processed/images/{filename}",
        "detections": detections
    }