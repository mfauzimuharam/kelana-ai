from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100, examples=["Alice"])
    email: EmailStr = Field(examples=["alice@email.com"])
    password: str = Field(min_length=8, max_length=128, examples=["password123"])

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("name must not be empty")
        return value


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["alice@email.com"])
    password: str = Field(min_length=1, examples=["password123"])


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    created_at: datetime


class ProfileResponse(UserResponse):
    total_trips: int
    total_conversations: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserResponse
