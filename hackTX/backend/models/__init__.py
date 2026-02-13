"""
Data models and schemas
"""
# Pydantic schemas (for API requests/responses)
from .schemas import HealthResponse

# SQLAlchemy database models (for database operations)
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
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
    
    # Relationships
    interview_sessions = relationship("InterviewSession", back_populates="user")
    financial_profiles = relationship("FinancialProfile", back_populates="user")


class FinancialProfile(Base):
    """Financial profile database model"""
    __tablename__ = "financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
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
    
    # Relationships
    user = relationship("User", back_populates="financial_profiles")


class InterviewSession(Base):
    """Interview session database model to track agent conversations"""
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Conversation state
    conversation_history = Column(Text, nullable=False, default="[]")  # JSON array of messages
    is_complete = Column(Boolean, default=False, nullable=False)
    
    # Extracted data from reviewer agent
    extracted_profile = Column(Text, nullable=True)  # JSON object from reviewer
    
    # Generated scenarios from node_maker agent
    financing_scenarios = Column(Text, nullable=True)  # JSON array of scenarios
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="interview_sessions")


__all__ = [
    "HealthResponse",
    "User",
    "FinancialProfile",
    "InterviewSession"
]

