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
    "FinancialProfile"
]

