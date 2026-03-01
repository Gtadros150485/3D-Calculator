from sqlalchemy import (
    Column, Integer, String, Float,
    DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)
    client = Column(String, default="")
    contact = Column(String, default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    parameters = Column(JSON, default={})
    calculation = Column(JSON, default={})
    ai_description = Column(Text, default="")
    ai_commercial_text = Column(Text, default="")

    owner = relationship("User", back_populates="projects")
    model_file = relationship("ModelFile", back_populates="project", uselist=False, cascade="all, delete-orphan")


class ModelFile(Base):
    __tablename__ = "model_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    file_format = Column(String, default="")

    status = Column(String, default="pending")
    error_message = Column(String, default="")

    dim_x = Column(Float, nullable=True)
    dim_y = Column(Float, nullable=True)
    dim_z = Column(Float, nullable=True)
    volume_cm3 = Column(Float, nullable=True)
    polygon_count = Column(Integer, nullable=True)
    surface_area_cm2 = Column(Float, nullable=True)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="model_file")
