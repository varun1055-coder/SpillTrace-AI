import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "SpillTrace AI"
    PROJECT_TAGLINE: str = "From Oil Spill Detection to Intelligent Vessel Attribution"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "replace-me-with-a-secure-secret-key"
    
    # Database: Defaults to SQLite with PostGIS-ready schema abstractions
    DATABASE_URL: str = "sqlite:///./spilltrace.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    # AI & Service Mock Flags
    USE_MOCK_MODELS: bool = False
    SENTINEL_API_KEY: str = ""
    SPIRE_AIS_API_KEY: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
