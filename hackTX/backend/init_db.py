"""
Initialize database tables
Run this script to create all tables defined in your models
"""
from hackTX.backend.database import engine, Base
from hackTX.backend.models import User, FinancialProfile, InterviewSession

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
