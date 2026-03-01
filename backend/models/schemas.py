from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime




class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut




class ProjectCreate(BaseModel):
    name: str
    client: Optional[str] = ""
    contact: Optional[str] = ""
    notes: Optional[str] = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client: Optional[str] = None
    contact: Optional[str] = None
    notes: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    calculation: Optional[Dict[str, Any]] = None
    ai_description: Optional[str] = None
    ai_commercial_text: Optional[str] = None


class ModelFileOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_format: str
    file_size: int
    status: str
    error_message: str
    dim_x: Optional[float]
    dim_y: Optional[float]
    dim_z: Optional[float]
    volume_cm3: Optional[float]
    polygon_count: Optional[int]
    surface_area_cm2: Optional[float]
    uploaded_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProjectOut(BaseModel):
    id: int
    name: str
    client: str
    contact: str
    notes: str
    parameters: Dict[str, Any]
    calculation: Dict[str, Any]
    ai_description: str
    ai_commercial_text: str
    created_at: datetime
    updated_at: Optional[datetime]
    model_file: Optional[ModelFileOut]

    class Config:
        from_attributes = True



class AIGenerateRequest(BaseModel):
    project_id: int
