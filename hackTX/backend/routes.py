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

from .models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    HealthResponse
)
from .services import (
    generate_vehicle_recommendations,
    generate_financing_scenarios,
    TOYOTA_VEHICLES
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
async def google_callback(request: Request):
    """Handle Google OAuth callback"""
    try:
        # Authorize and get token
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from token
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        
        # Create session token
        session_token = secrets.token_urlsafe(32)
        session_store[session_token] = {
            'email': user_info.get('email', ''),
            'name': user_info.get('name', ''),
            'picture': user_info.get('picture', ''),
            'sub': user_info.get('sub', ''),
            'id': str(uuid.uuid4())
        }
        
        # IMPORTANT: Use frontend_url, not backend_url
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
