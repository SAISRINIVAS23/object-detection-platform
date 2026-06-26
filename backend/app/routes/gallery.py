from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.database.deps import supabase, get_current_user
from app.schemas.detection import DetectionResponse

router = APIRouter()

@router.get("/", response_model=List[DetectionResponse])
def gallery(
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
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {str(e)}"
        )