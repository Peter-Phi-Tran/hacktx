"""
Application configuration and settings
"""
import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    app_name: str = "Tachyon API"
    app_version: str = "1.0.0"
    app_description: str = "AI-powered financial advisor for Toyota vehicle financing"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # CORS Configuration
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Database Configuration
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # Google AI Configuration
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    
    # Authentication (for future use)
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
