"""
Application configuration and settings
"""
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os
from pathlib import Path
from typing import List 

# Load .env from root directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

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
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./interview.db")
    
    # Google AI Configuration
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    google_cloud_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    google_cloud_location: str = os.getenv("GOOGLE_CLOUD_LOCATION", "global")
    
    # Authentication (for future use)
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Google OAuth
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    
    # Frontend URL for redirects
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")  # Changed this
    backend_url: str = os.getenv("VITE_BACKEND_URL", "http://localhost:8000")
    
    class Config:
        env_file = str(env_path)
        case_sensitive = False
        extra = "ignore" 
        
# Global settings instance
settings = Settings()
