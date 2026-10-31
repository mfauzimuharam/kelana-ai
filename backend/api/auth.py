"""Session 8 — register, login and current-user endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.deps import get_current_user
from database import get_db
from models import Conversation, Trip, User
from schemas.user import LoginRequest, ProfileResponse, RegisterRequest, TokenResponse, UserResponse
from services.auth_service import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    email = request.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    # NEVER store plain text — hash the password
    user = User(name=request.name, email=email, password_hash=hash_password(request.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == request.email.lower()))
    if user is None or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_access_token(user.id), user=user)


@router.get("/me", response_model=ProfileResponse)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_trips = db.scalar(select(func.count(Trip.id)).where(Trip.user_id == user.id))
    total_conversations = db.scalar(
        select(func.count(Conversation.id)).where(Conversation.user_id == user.id)
    )
    return ProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at,
        total_trips=total_trips or 0,
        total_conversations=total_conversations or 0,
    )
