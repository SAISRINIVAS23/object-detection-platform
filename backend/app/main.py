from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database.database import Base, engine
from app.routes.auth import router as auth_router
from app.routes.detection import router as detection_router

from app.models.user import User
from app.models.detection import Detection

# Load YOLO model when application starts
from app.ai.yolo_model import model

from app.routes.history import router as history_router
from app.routes.dashboard import router as dashboard_router
from app.routes.gallery import router as gallery_router

app = FastAPI(title="Object Detection API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create folders if they don't exist
os.makedirs("app/uploads/images", exist_ok=True)
os.makedirs("app/processed/images", exist_ok=True)
os.makedirs("app/uploads/videos", exist_ok=True)
os.makedirs("app/processed/videos", exist_ok=True)

# Register routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(detection_router, prefix="/detect", tags=["Detection"])

# Serve processed images
app.mount(
    "/processed",
    StaticFiles(directory="app/processed"),
    name="processed"
)

@app.get("/")
def root():
    return {
        "message": "Object Detection API Running"
    }


app.include_router(
    history_router,
    prefix="/history",
    tags=["History"]
)



app.include_router(
    dashboard_router,
    prefix="/dashboard",
    tags=["Dashboard"]
)



app.include_router(
    gallery_router,
    prefix="/gallery",
    tags=["Gallery"]
)