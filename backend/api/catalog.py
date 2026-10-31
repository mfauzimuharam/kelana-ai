"""Session 3 challenge + homework — public reference-data endpoints."""

from fastapi import APIRouter, Query

from services.trip_service import (
    RECOMMENDED_PLACES,
    TRANSPORTATIONS,
    TRAVEL_STYLES,
    TRIP_CATEGORIES,
    get_recommended_places,
    get_trip_category,
)

router = APIRouter(prefix="/api/v1", tags=["Catalog"])


@router.get("/trip-categories", response_model=list[str])
def get_trip_categories():
    return TRIP_CATEGORIES


@router.get("/transportations", response_model=list[str])
def get_transportations():
    return TRANSPORTATIONS


@router.get("/travel-styles", response_model=list[str])
def get_travel_styles():
    return TRAVEL_STYLES


@router.get("/destinations", response_model=list[str])
def get_destinations():
    return sorted(RECOMMENDED_PLACES)


@router.get("/recommendations", response_model=list[str])
def get_recommendations(
    destination: str = Query(default="Tokyo", examples=["Tokyo"]),
):
    """Recommended places for a destination (defaults to Tokyo as in the homework)."""
    return get_recommended_places(destination)


@router.get("/categorize")
def categorize(budget: float = Query(gt=0, examples=[2000])):
    return {"budget": budget, "category": get_trip_category(budget)}
