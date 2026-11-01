"""Database connection (Session 4): engine, session factory and Base class."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from core.config import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# engine = the connection pool
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)

# SessionLocal = a factory for DB sessions (one per API request)
SessionLocal = sessionmaker(bind=engine, autoflush=False)

# Base = all ORM models inherit from this
Base = declarative_base()


def init_db() -> None:
    """Create all SQLAlchemy tables for the configured database."""
    import models  # noqa: F401  (registers every model on Base.metadata)

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: open a session per request and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
