import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from multiple possible locations
# Try to load from hackTX/backend/.env first, then from project root
backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
project_root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")

if os.path.exists(backend_env):
    load_dotenv(backend_env)
elif os.path.exists(project_root_env):
    load_dotenv(project_root_env)
else:
    load_dotenv()  # Try default lookup


# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# If using SQLite and relative path, convert to absolute path
if DATABASE_URL.startswith("sqlite:///./"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    rel_path = DATABASE_URL.replace("sqlite:///./", "")
    abs_path = os.path.join(base_dir, rel_path)
    
    # Ensure the directory exists
    db_dir = os.path.dirname(abs_path)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    
    DATABASE_URL = f"sqlite:///{abs_path}"

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

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
