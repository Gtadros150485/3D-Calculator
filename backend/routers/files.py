import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.models import User, Project, ModelFile
from models.schemas import ModelFileOut
from services.auth_utils import get_current_user
from config import settings

router = APIRouter(prefix="/projects", tags=["files"])

ALLOWED_EXTENSIONS = {"stl", "obj", "3mf"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


@router.post("/{project_id}/upload", response_model=ModelFileOut)
async def upload_model(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate extension
    original_name = file.filename or "upload"
    ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 100MB)")

    # Save to disk
    os.makedirs(settings.upload_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(settings.upload_dir, stored_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Remove old model file for this project if exists
    old_file = db.query(ModelFile).filter(ModelFile.project_id == project_id).first()
    if old_file:
        try:
            os.remove(old_file.file_path)
        except Exception:
            pass
        db.delete(old_file)
        db.flush()

    # Create DB record
    model_file = ModelFile(
        project_id=project_id,
        filename=stored_name,
        original_filename=original_name,
        file_path=file_path,
        file_size=len(content),
        file_format=ext,
        status="pending",
    )
    db.add(model_file)
    db.commit()
    db.refresh(model_file)

    # Queue Celery task
    from worker.tasks import process_model_file
    process_model_file.delay(model_file.id)

    return model_file


@router.get("/{project_id}/model/status", response_model=ModelFileOut)
def get_model_status(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    model_file = db.query(ModelFile).filter(ModelFile.project_id == project_id).first()
    if not model_file:
        raise HTTPException(status_code=404, detail="No model file uploaded")

    return model_file
