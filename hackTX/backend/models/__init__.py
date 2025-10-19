"""
Data models and schemas
"""
# Pydantic schemas (for API requests/responses)
from .schemas import (
    FinancialConfig,
    VehicleRecommendation,
    FinancingScenario,
    AnalysisRequest,
    AnalysisResponse,
    HealthResponse
)

# SQLAlchemy database models (for database operations)
from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func
from ..database import Base


class User(Base):
    """User database model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    google_id = Column(String, unique=True, index=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FinancialProfile(Base):
    """Financial profile database model"""
    __tablename__ = "financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    income = Column(Float)
    credit_score = Column(String)
    down_payment = Column(Float)
    monthly_budget = Column(Float)
    loan_term = Column(Integer)
    vehicle_types = Column(Text)  # JSON string
    priorities = Column(Text)  # JSON string
    additional_context = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AnalysisHistory(Base):
    """Analysis history database model"""
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    config_snapshot = Column(Text, nullable=False)  # JSON snapshot of config
    vehicles_data = Column(Text, nullable=False)  # JSON array of recommended vehicles
    vehicle_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VehiclePreference(Base):
    """User vehicle preferences and interactions"""
    __tablename__ = "vehicle_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    vehicle_id = Column(Integer, nullable=False)
    vehicle_name = Column(String, nullable=False)
    is_favorite = Column(Integer, default=0)  # 0 = no, 1 = yes
    view_count = Column(Integer, default=0)
    last_viewed = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


__all__ = [
    # Schemas
    "FinancialConfig",
    "VehicleRecommendation",
    "FinancingScenario",
    "AnalysisRequest",
    "AnalysisResponse",
    "HealthResponse",
    # Database models
    "User",
    "FinancialProfile",
    "AnalysisHistory",
    "VehiclePreference"
]

