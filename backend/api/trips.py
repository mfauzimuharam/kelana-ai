"""Sessions 3-5 & 8 — trip CRUD, owned by the authenticated user, plus AI generation."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from api.deps import get_current_user
from database import get_db
from models import Trip, User
from schemas.trip import GenerateResponse, TripCreateRequest, TripResponse, TripUpdateRequest
from services import bedrock_service
from services.bedrock_service import AIServiceError
from services.trip_service import build_trip_plan, normalize_month

router = APIRouter(prefix="/api/v1/trips", tags=["Trips"])


def get_owned_trip(trip_id: int, user: User, db: Session) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    # Authorization: users may only touch their own trips.
    if trip.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this trip")
    return trip


def apply_rules(trip: Trip) -> None:
    """Reuse the Session 2 business rules whenever budget/days/month change."""
    trip.travel_month = normalize_month(trip.travel_month) or trip.travel_month
    plan = build_trip_plan(trip.budget, trip.days, trip.travel_month)
    trip.category = plan["category"]
    trip.daily_budget = plan["daily_budget"]
    trip.recommended_transport = plan["recommended_transport"]
    trip.season = plan["season"]


def run_generation(trip: Trip, db: Session) -> None:
    try:
        trip.ai_recommendation = bedrock_service.generate_itinerary(trip)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    db.commit()
    db.refresh(trip)


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    request: TripCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = Trip(
        **request.model_dump(exclude={"generate"}),
        user_id=user.id,  # ownership — the backend sets this, never the frontend
    )
    apply_rules(trip)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    if request.generate:
        run_generation(trip, db)
    return trip


@router.get("", response_model=list[TripResponse])
def list_trips(
    q: str | None = Query(default=None, description="Search destination, country or travel style"),
    sort: Literal["latest", "oldest", "budget_desc", "budget_asc"] = "latest",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Trip).where(Trip.user_id == user.id)
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.where(
            or_(
                Trip.destination.ilike(pattern),
                Trip.country.ilike(pattern),
                Trip.travel_style.ilike(pattern),
            )
        )
    order = {
        "latest": (Trip.created_at.desc(), Trip.id.desc()),
        "oldest": (Trip.created_at.asc(), Trip.id.asc()),
        "budget_desc": (Trip.budget.desc(), Trip.id.desc()),
        "budget_asc": (Trip.budget.asc(), Trip.id.desc()),
    }[sort]
    return db.scalars(query.order_by(*order)).all()


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_owned_trip(trip_id, user, db)


@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    request: TripUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_owned_trip(trip_id, user, db)
    changes = TripCreateRequest.model_validate(
        {
            **TripResponse.model_validate(trip).model_dump(),
            **request.model_dump(exclude_unset=True),
        }
    ).model_dump(exclude={"generate"})
    for field, value in changes.items():
        setattr(trip, field, value)
    # Recalculate category + daily_budget (+ transport, season) before saving.
    apply_rules(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = get_owned_trip(trip_id, user, db)
    db.delete(trip)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{trip_id}/generate", response_model=GenerateResponse)
def generate_trip(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve trip -> build prompt -> Amazon Bedrock -> save -> return (Session 5 lab)."""
    trip = get_owned_trip(trip_id, user, db)
    run_generation(trip, db)
    return GenerateResponse(
        trip_id=trip.id, destination=trip.destination, recommendation=trip.ai_recommendation
    )
