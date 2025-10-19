"""
API route handlers
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from .config import settings
from datetime import datetime
from typing import List
import secrets
import uuid
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    HealthResponse,
    InterviewStartResponse,
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewStatusResponse
)
from .services import (
    generate_vehicle_recommendations,
    generate_financing_scenarios,
    TOYOTA_VEHICLES
)
from .interview_service import (
    create_interview_session,
    process_interview_answer,
    get_interview_status
)


router = APIRouter()

# Initialize OAuth with proper configuration
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Store for session tokens (use Redis in production)
session_store = {}


def get_current_user_from_token(token: str) -> dict:
    """Get current user from session token"""
    if token not in session_store:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return session_store[token]


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        service="Tachyon API"
    )


@router.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_financial_profile(request: AnalysisRequest):
    """
    Analyze user's financial profile and return vehicle recommendations
    """
    try:
        # Generate recommendations based on configuration
        vehicles = generate_vehicle_recommendations(request.config)
        
        return AnalysisResponse(
            vehicles=vehicles,
            timestamp=datetime.now().isoformat(),
            message=f"Found {len(vehicles)} vehicle recommendations matching your criteria"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/vehicles")
async def get_all_vehicles():
    """
    Get all available Toyota vehicles
    """
    return {
        "vehicles": [
            {
                "id": v["id"],
                "name": v["vehicle"],
                "base_price": v["base_price"],
                "monthly_payment": v["monthly_payment"],
                "price_range": v.get("price_range")
            }
            for v in TOYOTA_VEHICLES
        ]
    }


@router.get("/api/scenarios/{vehicle_id}")
async def get_financing_scenarios(vehicle_id: int, monthly_payment: float):
    """
    Generate financing scenarios for a specific vehicle
    
    Args:
        vehicle_id: Vehicle ID
        monthly_payment: Current monthly payment amount
    """
    try:
        scenarios = generate_financing_scenarios(vehicle_id, monthly_payment)
        return {"scenarios": scenarios}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auth/google")
async def google_login(request: Request):
    """Redirect to Google OAuth login"""
    try:
        redirect_uri = settings.google_redirect_uri
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth initialization failed: {str(e)}")

@router.get("/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        # Authorize and get token
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from token
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        
        # Get or create user in database
        google_id = user_info.get('sub')
        email = user_info.get('email')
        name = user_info.get('name')
        picture = user_info.get('picture')
        
        # Check if user exists
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if not user:
            # Create new user
            user = User(
                email=email,
                name=name,
                google_id=google_id,
                picture=picture
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update existing user info
            user.email = email
            user.name = name
            user.picture = picture
            db.commit()
        
        # Create session token
        session_token = secrets.token_urlsafe(32)
        session_store[session_token] = {
            'user_id': user.id,
            'email': user.email,
            'name': user.name,
            'picture': user.picture,
            'google_id': user.google_id
        }
        
        # Redirect to frontend
        frontend_url = settings.frontend_url.rstrip('/')
        redirect_url = f"{frontend_url}/?token={session_token}"
        
        print(f"Redirecting to: {redirect_url}")  # Debug log
        
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        print(f"OAuth error: {str(e)}")  # Debug log
        frontend_url = settings.frontend_url.rstrip('/')
        error_message = str(e)
        return RedirectResponse(url=f"{frontend_url}/?error={error_message}")

@router.get("/auth/me")
async def get_current_user(token: str):
    """Get current user info from session token"""
    if token not in session_store:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return session_store[token]

@router.post("/auth/logout")
async def logout(token: str):
    """Logout user"""
    if token in session_store:
        del session_store[token]
    return {"message": "Logged out successfully"}


# ==================== Interview Endpoints ====================

@router.post("/api/interview/start", response_model=InterviewStartResponse)
async def start_interview(
    request: Request,
    db: Session = Depends(get_db)
):
    """Start a new interview session"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
        
        token = auth_header.replace("Bearer ", "")
        user_data = get_current_user_from_token(token)
        user_id = user_data.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # Create interview session
        session_id, first_question = create_interview_session(db, user_id)
        
        return InterviewStartResponse(
            session_id=session_id,
            question=first_question
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/interview/answer", response_model=InterviewAnswerResponse)
async def submit_interview_answer(
    answer_request: InterviewAnswerRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Submit an answer and get the next question"""
    try:
        # Verify user is authenticated
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
        
        token = auth_header.replace("Bearer ", "")
        get_current_user_from_token(token)  # Just to verify token is valid
        
        # Process the answer
        next_question, is_complete = process_interview_answer(
            db,
            answer_request.session_id,
            answer_request.answer
        )
        
        return InterviewAnswerResponse(
            question=next_question,
            is_complete=is_complete
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error processing answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/interview/status/{session_id}", response_model=InterviewStatusResponse)
async def check_interview_status(
    session_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Check the status of an interview session"""
    try:
        # Verify user is authenticated
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
        
        token = auth_header.replace("Bearer ", "")
        get_current_user_from_token(token)
        
        # Get status
        status = get_interview_status(db, session_id)
        
        return InterviewStatusResponse(**status)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error checking status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
