import os
import uuid
import base64
import cv2
import numpy as np
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Query
from pydantic import BaseModel

from app.ai.detector import detect_image, detect_video, detect_frame
from app.database.deps import supabase, get_current_user

router = APIRouter()

BUCKET_NAME = "gallery"

class FrameRequest(BaseModel):
    frame: str  # Base64 data string (JPEG)
    conf: float = 0.25

# DEFINED AS Synchronous 'def' to run in FastAPI's external thread pool.
# This prevents CPU-bound YOLO processing from blocking the main event loop.
@router.post("/image")
def detect_image_api(
    file: UploadFile = File(...),
    conf: float = Query(0.25, ge=0.1, le=1.0),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Use synchronous file.file.read() instead of async await
        content = file.file.read()
        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file uploaded."
            )
            
        results = detect_image_in_memory(img, conf=conf)
        detections = results["detections"]
        processed_bytes = results["processed_bytes"]

        extension = os.path.splitext(file.filename)[1] or ".jpg"
        filename = f"image_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{extension}"
        
        supabase.storage.from_(BUCKET_NAME).upload(
            path=f"processed/images/{filename}",
            file=processed_bytes,
            file_options={"content-type": "image/jpeg"}
        )

        db_detection = {
            "user_id": current_user["id"],
            "image_name": filename,
            "processed_image": f"/processed/images/{filename}",
            "detections": detections
        }
        supabase.table("detections").insert(db_detection).execute()

        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(f"processed/images/{filename}")

        return {
            "success": True,
            "message": "Detection completed and saved to cloud",
            "filename": filename,
            "processed_image": public_url,
            "detections": detections
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image detection/upload failed: {str(e)}"
        )

# DEFINED AS Synchronous 'def' to run in FastAPI's external thread pool.
# This prevents the server from freezing/buffering during heavy video analysis.
@router.post("/video")
def detect_video_api(
    file: UploadFile = File(...),
    conf: float = Query(0.25, ge=0.1, le=1.0),
    current_user: dict = Depends(get_current_user)
):
    extension = os.path.splitext(file.filename)[1] or ".mp4"
    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{extension}"

    temp_in_path = f"temp_in_{uuid.uuid4().hex}{extension}"
    temp_out_path = f"temp_out_{uuid.uuid4().hex}{extension}"

    try:
        content = file.file.read()
        with open(temp_in_path, "wb") as buffer:
            buffer.write(content)

        detections = detect_video(temp_in_path, temp_out_path, conf=conf)

        with open(temp_out_path, "rb") as f:
            video_bytes = f.read()

        supabase.storage.from_(BUCKET_NAME).upload(
            path=f"processed/videos/{filename}",
            file=video_bytes,
            file_options={"content-type": "video/mp4"}
        )

        db_detection = {
            "user_id": current_user["id"],
            "image_name": filename,
            "processed_image": f"/processed/videos/{filename}",
            "detections": detections
        }
        supabase.table("detections").insert(db_detection).execute()

        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(f"processed/videos/{filename}")

        return {
            "success": True,
            "message": "Video processed and saved to cloud",
            "filename": filename,
            "processed_video": public_url,
            "detections": detections
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video processing/upload failed: {str(e)}"
        )
    finally:
        if os.path.exists(temp_in_path):
            os.remove(temp_in_path)
        if os.path.exists(temp_out_path):
            os.remove(temp_out_path)

@router.post("/frame")
def detect_frame_api(
    request: FrameRequest,
    current_user: dict = Depends(get_current_user)
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
    current_user: dict = Depends(get_current_user)
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

    filename = f"webcam_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.jpg"

    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid frame image"
            )

        results = detect_image_in_memory(img, conf=request.conf)
        detections = results["detections"]
        processed_bytes = results["processed_bytes"]

        supabase.storage.from_(BUCKET_NAME).upload(
            path=f"processed/images/{filename}",
            file=processed_bytes,
            file_options={"content-type": "image/jpeg"}
        )

        db_detection = {
            "user_id": current_user["id"],
            "image_name": filename,
            "processed_image": f"/processed/images/{filename}",
            "detections": detections
        }
        supabase.table("detections").insert(db_detection).execute()

        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(f"processed/images/{filename}")

        return {
            "success": True,
            "message": "Webcam frame saved to cloud",
            "filename": filename,
            "processed_image": public_url,
            "detections": detections
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webcam capture upload failed: {str(e)}"
        )

def detect_image_in_memory(img_array, conf=0.25):
    from app.ai.yolo_model import model
    results = model(img_array, conf=conf, imgsz=320)
    annotated = results[0].plot()

    _, buffer = cv2.imencode(".jpg", annotated)
    processed_bytes = buffer.tobytes()

    detections = []
    for box in results[0].boxes:
        class_id = int(box.cls[0])
        class_name = model.names[class_id]
        confidence = float(box.conf[0])
        detections.append({
            "object": class_name,
            "confidence": round(confidence, 2)
        })
        
    return {
        "detections": detections,
        "processed_bytes": processed_bytes
    }