from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.models import User, Project, ModelFile
from models.schemas import ProjectOut
from services.auth_utils import get_current_user
from services.ai_service import generate_descriptions

router = APIRouter(prefix="/projects", tags=["ai"])


@router.post("/{project_id}/generate-ai", response_model=ProjectOut)
def generate_ai(
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
    model_data = None
    if model_file and model_file.status == "done":
        model_data = {
            "dim_x": model_file.dim_x,
            "dim_y": model_file.dim_y,
            "dim_z": model_file.dim_z,
            "volume_cm3": model_file.volume_cm3,
            "polygon_count": model_file.polygon_count,
        }

    description, commercial = generate_descriptions(
        project_name=project.name,
        client=project.client,
        model_data=model_data,
        parameters=project.parameters or {},
        calculation=project.calculation or {},
    )

    project.ai_description = description
    project.ai_commercial_text = commercial
    db.commit()
    db.refresh(project)
    return project


@router.post("/{project_id}/calculate", response_model=ProjectOut)
def run_calculation(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run/re-run calculation and save results to project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    model_file = db.query(ModelFile).filter(ModelFile.project_id == project_id).first()
    model_data = None
    if model_file and model_file.status == "done":
        model_data = {
            "volume_cm3": model_file.volume_cm3,
            "dim_x": model_file.dim_x,
            "dim_y": model_file.dim_y,
            "dim_z": model_file.dim_z,
            "polygon_count": model_file.polygon_count,
        }

    from services.calculator import calculate
    result = calculate(model_data, project.parameters or {})
    project.calculation = result
    db.commit()
    db.refresh(project)
    return project
