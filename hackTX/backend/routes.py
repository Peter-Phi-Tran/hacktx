"""
API route handlers
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from .database import get_db
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
from .db_services import (
    get_or_create_user,
    save_financial_profile,
    get_financial_profile,
    profile_to_config,
    save_analysis_result,
    get_analysis_history,
    get_latest_analysis,
    save_vehicle_preference,
    get_user_favorites,
    toggle_favorite
)


router = APIRouter()

# Temporary user ID for development (until OAuth is implemented)
TEMP_USER_ID = 1
TEMP_USER_EMAIL = "demo@tachyon.dev"
TEMP_USER_NAME = "Demo User"


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        service="Tachyon API"
    )


@router.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_financial_profile(request: AnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyze user's financial profile and return vehicle recommendations
    Saves analysis to database for persistence
    """
    try:
        # Ensure user exists in database
        user = get_or_create_user(
            db,
            email=TEMP_USER_EMAIL,
            name=TEMP_USER_NAME
        )
        
        # Save financial profile
        save_financial_profile(db, user.id, request.config)
        
        # Generate recommendations based on configuration
        vehicles = generate_vehicle_recommendations(request.config)
        
        # Save analysis result to history
        save_analysis_result(db, user.id, request.config, vehicles)
        
        return AnalysisResponse(
            vehicles=vehicles,
            timestamp=datetime.now().isoformat(),
            message=f"Found {len(vehicles)} vehicle recommendations matching your criteria"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/profile")
async def get_user_profile(db: Session = Depends(get_db)):
    """
    Get user's saved financial profile
    """
    try:
        # Get user
        user = get_or_create_user(
            db,
            email=TEMP_USER_EMAIL,
            name=TEMP_USER_NAME
        )
        
        # Get profile
        profile = get_financial_profile(db, user.id)
        
        if not profile:
            return {"message": "No profile found"}
        
        # Convert to config format
        config = profile_to_config(profile)
        
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            },
            "profile": config.model_dump(),
            "updated_at": profile.updated_at.isoformat() if profile.updated_at else profile.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/history")
async def get_user_history(limit: int = 10, db: Session = Depends(get_db)):
    """
    Get user's analysis history
    """
    try:
        # Get user
        user = get_or_create_user(
            db,
            email=TEMP_USER_EMAIL,
            name=TEMP_USER_NAME
        )
        
        # Get history
        history = get_analysis_history(db, user.id, limit)
        
        return {
            "user_id": user.id,
            "history": history,
            "count": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/latest")
async def get_latest_user_analysis(db: Session = Depends(get_db)):
    """
    Get user's most recent analysis
    """
    try:
        # Get user
        user = get_or_create_user(
            db,
            email=TEMP_USER_EMAIL,
            name=TEMP_USER_NAME
        )
        
        # Get latest analysis
        latest = get_latest_analysis(db, user.id)
        
        if not latest:
            return {"message": "No analysis found"}
        
        return latest
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


@router.post("/api/favorites/{vehicle_id}")
async def toggle_vehicle_favorite(
    vehicle_id: int,
    vehicle_name: str,
    db: Session = Depends(get_db)
):
    """
    Toggle favorite status for a vehicle
    """
    try:
        # Get user
        user = get_or_create_user(
            db,
            email=TEMP_USER_EMAIL,
            name=TEMP_USER_NAME
        )
        
        # Toggle favorite
        is_favorite = toggle_favorite(db, user.id, vehicle_id, vehicle_name)
        
        return {
            "vehicle_id": vehicle_id,
            "is_favorite": is_favorite,
            "message": f"Vehicle {'added to' if is_favorite else 'removed from'} favorites"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/favorites")
async def get_favorites(db: Session = Depends(get_db)):
    """
    Get user's favorite vehicles
    """
    try:
        # Get user
        user = get_or_create_user(
            db,
            email=TEMP_USER_EMAIL,
            name=TEMP_USER_NAME
        )
        
        # Get favorites
        favorites = get_user_favorites(db, user.id)
        
        return {
            "favorites": [
                {
                    "vehicle_id": fav.vehicle_id,
                    "vehicle_name": fav.vehicle_name,
                    "view_count": fav.view_count,
                    "notes": fav.notes,
                    "last_viewed": fav.last_viewed.isoformat()
                }
                for fav in favorites
            ],
            "count": len(favorites)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/vehicle-view/{vehicle_id}")
async def record_vehicle_view(
    vehicle_id: int,
    vehicle_name: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Record that user viewed a vehicle
    """
    try:
        # Get user
        user = get_or_create_user(
            db,
            email=TEMP_USER_EMAIL,
            name=TEMP_USER_NAME
        )
        
        # Save preference (increments view count)
        pref = save_vehicle_preference(
            db,
            user.id,
            vehicle_id,
            vehicle_name,
            is_favorite=False,
            notes=notes
        )
        
        return {
            "vehicle_id": vehicle_id,
            "view_count": pref.view_count,
            "message": "View recorded"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
