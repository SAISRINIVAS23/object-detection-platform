from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.schemas.user import UserRegister, UserLogin
from app.models.user import User
from app.models.detection import Detection
from app.database.deps import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()

    return {
        "message": "User registered successfully"
    }

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )

    token = create_access_token(
        {
            "sub": db_user.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_detections = db.query(Detection).filter(Detection.user_id == current_user.id).count()
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "total_detections": total_detections
    }

@router.put("/profile")
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.username is not None:
        current_user.username = data.username
    if data.email is not None:
        # Check if email exists on another user
        conflict_user = db.query(User).filter(User.email == data.email, User.id != current_user.id).first()
        if conflict_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use by another account"
            )
        current_user.email = data.email
    if data.password is not None and data.password != "":
        current_user.password_hash = hash_password(data.password)

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "username": current_user.username,
        "email": current_user.email
    }
