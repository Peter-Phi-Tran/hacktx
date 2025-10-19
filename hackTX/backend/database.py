import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment - PostgreSQL only
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is required. "
        "Please set it in your .env file to a PostgreSQL connection string. "
        "Example: postgresql://user:password@localhost:5432/dbname"
    )

if not DATABASE_URL.startswith("postgresql"):
    raise ValueError(
        f"Only PostgreSQL databases are supported. "
        f"DATABASE_URL must start with 'postgresql://'. "
        f"Current value starts with: {DATABASE_URL.split('://')[0]}://"
    )

# Create SQLAlchemy engine with PostgreSQL connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5,
    max_overflow=10
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
