"""
Database service functions for persisting user data
"""
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .models import User, FinancialProfile, AnalysisHistory, VehiclePreference
from .models.schemas import FinancialConfig, VehicleRecommendation

def get_or_create_user(
    db: Session,
    email: str,
    name: str,
    google_id: Optional[str] = None,
    picture: Optional[str] = None
) -> User:
    """
    Get existing user or create new one
    
    Args:
        db: Database session
        email: User email
        name: User name
        google_id: Google account ID (optional)
        picture: Profile picture URL (optional)
        
    Returns:
        User object
    """
    # Try to find existing user by email
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Update user info if it changed
        user.name = name
        if google_id:
            user.google_id = google_id
        if picture:
            user.picture = picture
        user.updated_at = datetime.now()
        db.commit()
        db.refresh(user)
        return user
    
    # Create new user
    new_user = User(
        email=email,
        name=name,
        google_id=google_id,
        picture=picture
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

def save_financial_profile(
    db: Session,
    user_id: int,
    config: FinancialConfig
) -> FinancialProfile:
    """
    Save or update user's financial profile
    
    Args:
        db: Database session
        user_id: User ID
        config: Financial configuration
        
    Returns:
        FinancialProfile object
    """
    # Check if profile exists
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == user_id
    ).first()
    
    # Convert lists to JSON strings
    vehicle_types_json = json.dumps(config.vehicle_types)
    priorities_json = json.dumps(config.priorities)
    
    if profile:
        # Update existing profile
        profile.income = config.income
        profile.credit_score = config.credit_score
        profile.down_payment = config.down_payment
        profile.monthly_budget = config.monthly_budget
        profile.loan_term = config.loan_term
        profile.vehicle_types = vehicle_types_json
        profile.priorities = priorities_json
        profile.additional_context = config.additional_context
        profile.updated_at = datetime.now()
    else:
        # Create new profile
        profile = FinancialProfile(
            user_id=user_id,
            income=config.income,
            credit_score=config.credit_score,
            down_payment=config.down_payment,
            monthly_budget=config.monthly_budget,
            loan_term=config.loan_term,
            vehicle_types=vehicle_types_json,
            priorities=priorities_json,
            additional_context=config.additional_context
        )
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    return profile


def get_financial_profile(db: Session, user_id: int) -> Optional[FinancialProfile]:
    """
    Get user's latest financial profile
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        FinancialProfile object or None
    """
    return db.query(FinancialProfile).filter(
        FinancialProfile.user_id == user_id
    ).first()


def profile_to_config(profile: FinancialProfile) -> FinancialConfig:
    """
    Convert database profile to FinancialConfig schema
    
    Args:
        profile: FinancialProfile database object
        
    Returns:
        FinancialConfig object
    """
    return FinancialConfig(
        income=profile.income,
        credit_score=profile.credit_score,
        down_payment=profile.down_payment,
        monthly_budget=profile.monthly_budget,
        loan_term=profile.loan_term,
        vehicle_types=json.loads(profile.vehicle_types) if profile.vehicle_types else [],
        priorities=json.loads(profile.priorities) if profile.priorities else [],
        additional_context=profile.additional_context or ""
    )

def save_analysis_result(
    db: Session,
    user_id: int,
    config: FinancialConfig,
    vehicles: List[VehicleRecommendation]
) -> AnalysisHistory:
    """
    Save analysis result to history
    
    Args:
        db: Database session
        user_id: User ID
        config: Financial configuration used
        vehicles: List of vehicle recommendations
        
    Returns:
        AnalysisHistory object
    """
    # Convert to JSON
    config_json = config.model_dump_json()
    vehicles_json = json.dumps([v.model_dump() for v in vehicles])
    
    analysis = AnalysisHistory(
        user_id=user_id,
        config_snapshot=config_json,
        vehicles_data=vehicles_json,
        vehicle_count=len(vehicles)
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    return analysis


def get_analysis_history(
    db: Session,
    user_id: int,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get user's analysis history
    
    Args:
        db: Database session
        user_id: User ID
        limit: Maximum number of results to return
        
    Returns:
        List of analysis history dictionaries
    """
    history = db.query(AnalysisHistory).filter(
        AnalysisHistory.user_id == user_id
    ).order_by(
        desc(AnalysisHistory.created_at)
    ).limit(limit).all()
    
    results = []
    for record in history:
        results.append({
            "id": record.id,
            "config": json.loads(record.config_snapshot),
            "vehicles": json.loads(record.vehicles_data),
            "vehicle_count": record.vehicle_count,
            "created_at": record.created_at.isoformat()
        })
    
    return results


def get_latest_analysis(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    """
    Get user's most recent analysis
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Analysis dictionary or None
    """
    record = db.query(AnalysisHistory).filter(
        AnalysisHistory.user_id == user_id
    ).order_by(
        desc(AnalysisHistory.created_at)
    ).first()
    
    if not record:
        return None
    
    return {
        "id": record.id,
        "config": json.loads(record.config_snapshot),
        "vehicles": json.loads(record.vehicles_data),
        "vehicle_count": record.vehicle_count,
        "created_at": record.created_at.isoformat()
    }

def save_vehicle_preference(
    db: Session,
    user_id: int,
    vehicle_id: int,
    vehicle_name: str,
    is_favorite: bool = False,
    notes: Optional[str] = None
) -> VehiclePreference:
    """
    Save or update vehicle preference
    
    Args:
        db: Database session
        user_id: User ID
        vehicle_id: Vehicle ID
        vehicle_name: Vehicle name
        is_favorite: Whether vehicle is favorited
        notes: Optional user notes
        
    Returns:
        VehiclePreference object
    """
    # Check if preference exists
    pref = db.query(VehiclePreference).filter(
        VehiclePreference.user_id == user_id,
        VehiclePreference.vehicle_id == vehicle_id
    ).first()
    
    if pref:
        # Update existing preference
        pref.is_favorite = 1 if is_favorite else 0
        pref.view_count += 1
        pref.last_viewed = datetime.now()
        if notes:
            pref.notes = notes
        pref.updated_at = datetime.now()
    else:
        # Create new preference
        pref = VehiclePreference(
            user_id=user_id,
            vehicle_id=vehicle_id,
            vehicle_name=vehicle_name,
            is_favorite=1 if is_favorite else 0,
            view_count=1,
            notes=notes
        )
        db.add(pref)
    
    db.commit()
    db.refresh(pref)
    return pref


def get_user_favorites(db: Session, user_id: int) -> List[VehiclePreference]:
    """
    Get user's favorite vehicles
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        List of VehiclePreference objects
    """
    return db.query(VehiclePreference).filter(
        VehiclePreference.user_id == user_id,
        VehiclePreference.is_favorite == 1
    ).order_by(
        desc(VehiclePreference.updated_at)
    ).all()


def get_vehicle_history(db: Session, user_id: int) -> List[VehiclePreference]:
    """
    Get user's vehicle viewing history
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        List of VehiclePreference objects sorted by last viewed
    """
    return db.query(VehiclePreference).filter(
        VehiclePreference.user_id == user_id
    ).order_by(
        desc(VehiclePreference.last_viewed)
    ).all()


def toggle_favorite(
    db: Session,
    user_id: int,
    vehicle_id: int,
    vehicle_name: str
) -> bool:
    """
    Toggle favorite status for a vehicle
    
    Args:
        db: Database session
        user_id: User ID
        vehicle_id: Vehicle ID
        vehicle_name: Vehicle name
        
    Returns:
        New favorite status (True = favorited, False = unfavorited)
    """
    pref = db.query(VehiclePreference).filter(
        VehiclePreference.user_id == user_id,
        VehiclePreference.vehicle_id == vehicle_id
    ).first()
    
    if pref:
        # Toggle existing preference
        pref.is_favorite = 1 if pref.is_favorite == 0 else 0
        pref.updated_at = datetime.now()
    else:
        # Create new preference as favorite
        pref = VehiclePreference(
            user_id=user_id,
            vehicle_id=vehicle_id,
            vehicle_name=vehicle_name,
            is_favorite=1,
            view_count=0
        )
        db.add(pref)
    
    db.commit()
    db.refresh(pref)
    
    return pref.is_favorite == 1
