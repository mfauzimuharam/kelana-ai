from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    # Never store plain-text passwords — only the bcrypt hash.
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    trips = relationship("Trip", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship(
        "Conversation", back_populates="owner", cascade="all, delete-orphan"
    )
