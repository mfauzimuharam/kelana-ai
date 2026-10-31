from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True)
    # Ownership (Session 8) — always set by the backend from the JWT.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    destination = Column(String(120), nullable=False)
    country = Column(String(120), nullable=True)
    days = Column(Integer, nullable=False)
    budget = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    travel_style = Column(String(50), nullable=True)
    travel_month = Column(String(20), nullable=True)

    # Derived by the rule-based recommendation engine (Session 2)
    category = Column(String(20), nullable=False)
    daily_budget = Column(Float, nullable=False)
    recommended_transport = Column(String(20), nullable=False)
    season = Column(String(30), nullable=True)

    # AI-generated itinerary (Session 5) — long text, so Text not String.
    ai_recommendation = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="trips")
