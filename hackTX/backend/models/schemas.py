"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel
from typing import List, Optional


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
