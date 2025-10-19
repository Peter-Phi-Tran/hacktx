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
    is_followup: Optional[bool] = False
    validation: Optional[Dict] = None
    progress: Optional[Dict] = None
    analysis: Optional[Dict] = None
    recommendations: Optional[Dict] = None

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
        print(f"[INFO] Processing answer for session: {request.session_id}")
        print(f"[INFO] User answer: {request.answer}")
        
        session = interview_sessions[request.session_id]
        agent: RootAgent = session["agent"]
        
        # Process answer through ADK agent (includes validation)
        response = agent.process_answer(request.answer)
        
        print(f"[INFO] Next question: {response['next_question']}")
        print(f"[INFO] Is complete: {response['is_complete']}")
        
        if response.get('validation'):
            print(f"[INFO] Validation quality: {response['validation'].get('quality_score', 'N/A')}")
        
        # If interview is complete, save data and return analysis
        if response["is_complete"]:
            session["final_data"] = agent.get_session_data()
            print(f"[INFO] Interview completed. Analysis and recommendations generated.")
        
        return AnswerResponse(
            next_question=response["next_question"],
            is_complete=response["is_complete"],
            is_followup=response.get("is_followup", False),
            validation=response.get("validation"),
            progress=response.get("progress"),
            analysis=response.get("analysis"),
            recommendations=response.get("recommendations")
        )
    except Exception as e:
        print(f"[ERROR] Failed to process answer: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process answer: {str(e)}")

# Add new endpoint to get results
@router.get("/api/interview/results/{session_id}")
async def get_interview_results(session_id: str):
    """Get complete interview results including analysis and recommendations"""
    if session_id not in interview_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = interview_sessions[session_id]
    agent: RootAgent = session["agent"]
    
    analysis = agent.get_analysis()
    recommendations = agent.get_recommendations()
    
    if not analysis or not recommendations:
        raise HTTPException(status_code=400, detail="Interview not yet complete")
    
    return {
        "session_id": session_id,
        "analysis": analysis,
        "recommendations": recommendations,
        "conversation": agent.interviewer.get_conversation_summary()
    }
