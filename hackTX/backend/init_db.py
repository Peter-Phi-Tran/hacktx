"""
Initialize database tables
Run this script to create all tables defined in your models
"""
from hackTX.backend.database import engine, Base
from hackTX.backend.models import User, FinancialProfile, AnalysisHistory, VehiclePreference

def init_db():
    """Initialize database tables"""
    print("  Creating database tables...")
    print("   - users")
    print("   - financial_profiles")
    print("   - analysis_history")
    print("   - vehicle_preferences")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("\nDatabase tables created successfully!")
        print("\nDatabase is ready to use!")
    except Exception as e:
        print(f"\nError creating database tables: {e}")
        raise

if __name__ == "__main__":
    init_db()
