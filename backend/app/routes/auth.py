from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.schemas.user import UserRegister, UserLogin
from app.database.deps import supabase, get_current_user
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

@router.post("/register")
def register(user: UserRegister):
    try:
        response = supabase.table("users").select("*").eq("email", user.email).execute()
        if response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )

        new_user = {
            "username": user.username,
            "email": user.email,
            "password_hash": hash_password(user.password)
        }
        supabase.table("users").insert(new_user).execute()
        return {
            "message": "User registered successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.post("/login")
def login(user: UserLogin):
    try:
        response = supabase.table("users").select("*").eq("email", user.email).execute()
        users = response.data
        if not users:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email or password"
            )

        db_user = users[0]
        if not verify_password(user.password, db_user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email or password"
            )

        token = create_access_token(
            {
                "sub": db_user["email"]
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    try:
        count_response = supabase.table("detections").select("id", count="exact").eq("user_id", current_user["id"]).execute()
        total_detections = count_response.count or 0
        return {
            "id": current_user["id"],
            "username": current_user["username"],
            "email": current_user["email"],
            "total_detections": total_detections
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading profile stats: {str(e)}"
        )

@router.put("/profile")
def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    if data.username is not None:
        update_data["username"] = data.username
    if data.email is not None:
        try:
            conflict_res = supabase.table("users").select("*").eq("email", data.email).neq("id", current_user["id"]).execute()
            if conflict_res.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is already in use by another account"
                )
            update_data["email"] = data.email
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
            
    if data.password is not None and data.password != "":
        update_data["password_hash"] = hash_password(data.password)

    if not update_data:
        return {
            "message": "No fields to update",
            "username": current_user["username"],
            "email": current_user["email"]
        }

    try:
        supabase.table("users").update(update_data).eq("id", current_user["id"]).execute()
        
        # Get updated user info
        new_username = update_data.get("username", current_user["username"])
        new_email = update_data.get("email", current_user["email"])
        
        return {
            "message": "Profile updated successfully",
            "username": new_username,
            "email": new_email
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing profile update: {str(e)}"
        )
