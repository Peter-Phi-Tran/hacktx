"""
API route handlers
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, Dict
from authlib.integrations.starlette_client import OAuth
from .config import settings
from .adk.root_agent import RootAgent
import secrets
import uuid

router = APIRouter()

# OAuth setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# Session stores
session_store = {}
interview_sessions = {}  # Store active interview sessions

# Pydantic models
class InterviewStartResponse(BaseModel):
    session_id: str
    question: str

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

class AnswerResponse(BaseModel):
    next_question: str
    is_complete: bool
    progress: Optional[Dict] = None

# ===== AUTH ROUTES =====
@router.get("/auth/google")
async def google_login(request: Request):
    """Redirect to Google OAuth login"""
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback")
async def google_callback(request: Request):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        
        session_token = secrets.token_urlsafe(32)
        session_store[session_token] = {
            'email': user_info.get('email', ''),
            'name': user_info.get('name', ''),
            'picture': user_info.get('picture', ''),
            'sub': user_info.get('sub', ''),
            'id': str(uuid.uuid4())
        }
        
        frontend_url = settings.frontend_url.rstrip('/')
        return RedirectResponse(url=f"{frontend_url}/?token={session_token}")
        
    except Exception as e:
        frontend_url = settings.frontend_url.rstrip('/')
        return RedirectResponse(url=f"{frontend_url}/?error={str(e)}")

@router.get("/auth/me")
async def get_current_user(token: str):
    """Get current user info"""
    if token not in session_store:
        raise HTTPException(status_code=401, detail="Invalid token")
    return session_store[token]

@router.post("/auth/logout")
async def logout(token: str):
    """Logout user"""
    if token in session_store:
        del session_store[token]
    return {"message": "Logged out successfully"}

# ===== INTERVIEW ROUTES =====
@router.post("/api/interview/start", response_model=InterviewStartResponse)
async def start_interview():
    """Start a new interview session with ADK agent"""
    try:
        # Create session ID
        session_id = str(uuid.uuid4())
        
        # Initialize RootAgent for this session
        agent = RootAgent()
        
        # Get first question from interviewer agent
        first_question = agent.start_interview()
        
        # Store session
        interview_sessions[session_id] = {
            "agent": agent,
            "created_at": str(uuid.uuid4()),  # timestamp
        }
        
        return InterviewStartResponse(
            session_id=session_id,
            question=first_question
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")

@router.post("/api/interview/answer", response_model=AnswerResponse)
async def submit_answer(request: AnswerRequest):
    """Submit answer and get next question from ADK agent"""
    if request.session_id not in interview_sessions:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    try:
        session = interview_sessions[request.session_id]
        agent: RootAgent = session["agent"]
        
        # Process answer through ADK agent
        response = agent.process_answer(request.answer)
        
        # If interview is complete, save data
        if response["is_complete"]:
            session["final_data"] = agent.get_session_data()
            print(f"Interview completed. Data: {session['final_data']}")
        
        return AnswerResponse(
            next_question=response["next_question"],
            is_complete=response["is_complete"],
            progress=response.get("progress")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process answer: {str(e)}")

@router.post("/api/interview/end")
async def end_interview(session_id: str):
    """End interview session"""
    if session_id in interview_sessions:
        # Get final data before cleanup
        final_data = interview_sessions[session_id]["agent"].get_session_data()
        
        # Here you can save to database
        # db.save_interview(final_data)
        
        del interview_sessions[session_id]
        
        return {"status": "success", "message": "Interview ended", "data": final_data}
    
    return {"status": "success", "message": "Session already ended"}

@router.get("/api/interview/status/{session_id}")
async def get_interview_status(session_id: str):
    """Get current interview status"""
    if session_id not in interview_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = interview_sessions[session_id]
    agent: RootAgent = session["agent"]
    
    return {
        "session_id": session_id,
        "questions_asked": agent.interviewer.questions_asked,
        "max_questions": agent.interviewer.max_questions,
        "is_complete": agent.interviewer.questions_asked > agent.interviewer.max_questions
    }
