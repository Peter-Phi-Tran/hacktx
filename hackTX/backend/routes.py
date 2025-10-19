"""
API route handlers
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import List

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
