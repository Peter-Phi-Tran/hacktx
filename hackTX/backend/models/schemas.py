"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class FinancialConfig(BaseModel):
    """User's financial configuration"""
    income: float = Field(..., description="Monthly income in dollars", gt=0)
    credit_score: str = Field(..., description="Credit score range")
    down_payment: float = Field(..., description="Down payment amount", ge=0)
    monthly_budget: float = Field(..., description="Maximum monthly payment budget", gt=0)
    loan_term: int = Field(..., description="Loan term in months", gt=0)
    vehicle_types: List[str] = Field(default=[], description="Preferred vehicle types")
    priorities: List[str] = Field(default=[], description="User priorities")
    additional_context: str = Field(default="", description="Additional context")


class VehicleRecommendation(BaseModel):
    """Vehicle recommendation with 3D position"""
    id: int
    vehicle: str
    x: float
    y: float
    z: float
    size: int
    color: str
    monthly_payment: int
    affordability: str
    price_range: Optional[str] = None
    why: Optional[str] = None


class FinancingScenario(BaseModel):
    """Financing scenario for a vehicle"""
    id: int
    vehicle: str
    scenario_name: str
    down_payment: float
    loan_term: int
    interest_rate: float
    monthly_payment: float
    total_cost: float
    savings_vs_base: float
    outcome: str


class AnalysisRequest(BaseModel):
    """Request for financial analysis"""
    config: FinancialConfig


class AnalysisResponse(BaseModel):
    """Response with vehicle recommendations"""
    vehicles: List[VehicleRecommendation]
    timestamp: str
    message: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    service: str


class InterviewStartResponse(BaseModel):
    """Response when starting an interview"""
    session_id: str
    question: str


class InterviewAnswerRequest(BaseModel):
    """Request to submit an answer"""
    session_id: str
    answer: str


class InterviewAnswerResponse(BaseModel):
    """Response after submitting an answer"""
    question: str
    is_complete: bool


class InterviewStatusResponse(BaseModel):
    """Response for interview status check"""
    session_id: str
    is_complete: bool
    scenarios: Optional[List[dict]] = None


class ConversationMessage(BaseModel):
    """Single message in conversation"""
    role: str  # 'agent' or 'user'
    content: str
    timestamp: str
