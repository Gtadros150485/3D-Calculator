from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from config import settings
from database import create_tables
from models.schemas import UserOut
from services.auth_utils import get_current_user
from models.models import User

from routers import auth, projects, files, ai

app = FastAPI(
    title="3D Cost Calculator API",
    description="Calculate production costs for 3D printed parts",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


@app.get("/api/auth/me", response_model=UserOut, tags=["auth"])
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def startup():
    create_tables()
    os.makedirs(settings.upload_dir, exist_ok=True)
