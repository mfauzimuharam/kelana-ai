from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


class TripRequest(BaseModel):
    destination: str = Field(min_length=1, max_length=120, examples=["Japan"])
    days: int = Field(gt=0, le=60, examples=[5])
    budget: float = Field(gt=0, examples=[2000])
    travel_style: str | None = Field(default=None, max_length=50, examples=["Family"])
    country: str | None = Field(default=None, max_length=120, examples=["Japan"])
    currency: str = Field(default="USD", min_length=3, max_length=10, examples=["USD"])
    travel_month: str | None = Field(default=None, max_length=20, examples=["December"])

    @field_validator("destination")
    @classmethod
    def clean_destination(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("destination must not be empty")
        return value

    @field_validator("travel_style", "country", "travel_month")
    @classmethod
    def clean_optional(cls, value: str | None) -> str | None:
        return _clean(value)

    @field_validator("currency")
    @classmethod
    def upper_currency(cls, value: str) -> str:
        return value.strip().upper()


class TripCreateRequest(TripRequest):
    generate: bool = Field(
        default=False,
        description="Also generate the AI itinerary with Amazon Bedrock in the same request.",
    )


class TripUpdateRequest(BaseModel):
    """PUT /trips/{id} — every field optional; rules are recalculated."""

    destination: str | None = Field(default=None, min_length=1, max_length=120)
    days: int | None = Field(default=None, gt=0, le=60)
    budget: float | None = Field(default=None, gt=0)
    travel_style: str | None = Field(default=None, max_length=50)
    country: str | None = Field(default=None, max_length=120)
    currency: str | None = Field(default=None, min_length=3, max_length=10)
    travel_month: str | None = Field(default=None, max_length=20)


class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    destination: str
    country: str | None
    days: int
    budget: float
    currency: str
    travel_style: str | None
    travel_month: str | None
    season: str | None
    category: str
    daily_budget: float
    recommended_transport: str
    ai_recommendation: str | None
    created_at: datetime
    updated_at: datetime | None

    @computed_field(description="Alias kept for Session 3 compatibility.")
    @property
    def recommendation_transport(self) -> str:
        return self.recommended_transport


class GenerateResponse(BaseModel):
    trip_id: int
    destination: str
    recommendation: str
