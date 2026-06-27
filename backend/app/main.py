from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.routes.auth import router as auth_router
from app.routes.detection import router as detection_router
from app.routes.history import router as history_router
from app.routes.dashboard import router as dashboard_router
from app.routes.gallery import router as gallery_router
from app.database.deps import supabase

import os
import glob

app = FastAPI(title="Object Detection API")

@app.on_event("startup")
def cleanup_temp_files():
    print("Cleaning up leftover temporary video files...")
    # Clean up in both current working directory and the backend folder
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dirs = {os.getcwd(), backend_dir}
    
    for directory in target_dirs:
        for pattern in ["temp_in_*", "temp_out_*"]:
            search_path = os.path.join(directory, pattern)
            for file_path in glob.glob(search_path):
                try:
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                        print(f"Removed leftover temporary file: {file_path}")
                except Exception as e:
                    print(f"Error removing {file_path}: {e}")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(detection_router, prefix="/detect", tags=["Detection"])
app.include_router(history_router, prefix="/history", tags=["History"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(gallery_router, prefix="/gallery", tags=["Gallery"])

@app.get("/")
def root():
    return {
        "message": "Object Detection API Running with Supabase"
    }

# Serve processed images dynamically via Supabase Storage Redirects
# This ensures no local storage consumption on the client's laptop
@app.get("/processed/images/{filename}")
def redirect_image(filename: str):
    public_url = supabase.storage.from_("gallery").get_public_url(f"processed/images/{filename}")
    return RedirectResponse(url=public_url)

@app.get("/processed/videos/{filename}")
def redirect_video(filename: str):
    public_url = supabase.storage.from_("gallery").get_public_url(f"processed/videos/{filename}")
    return RedirectResponse(url=public_url)