from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):



    database_url: str = Field(
        default="postgresql://calculator:secret@db:5432/calculator_db",
        validation_alias="DATABASE_URL",
    )


    redis_url: str = Field(
        default="redis://redis:6379/0",
        validation_alias="REDIS_URL",
    )
    celery_broker_url: str = Field(
        default="redis://redis:6379/0",
        validation_alias="CELERY_BROKER_URL",
    )
    celery_result_backend: str = Field(
        default="redis://redis:6379/0",
        validation_alias="CELERY_RESULT_BACKEND",
    )


    secret_key: str = Field(
        default="change-me-to-a-long-random-string",
        validation_alias="SECRET_KEY",
    )
    algorithm: str = Field(
        default="HS256",
        validation_alias="ALGORITHM",
    )
    access_token_expire_minutes: int = Field(
        default=10080,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )


    upload_dir: str = Field(
        default="/app/uploads",
        validation_alias="UPLOAD_DIR",
    )


    anthropic_api_key: Optional[str] = Field(
        default=None,
        validation_alias="ANTHROPIC_API_KEY",
    )


    frontend_url: str = Field(
        default="http://localhost:3000",
        validation_alias="FRONTEND_URL",
    )

    model_config = {

        "env_file": ".env",
        "env_file_encoding": "utf-8",

        "case_sensitive": False,

        "extra": "ignore",
    }

settings = Settings()