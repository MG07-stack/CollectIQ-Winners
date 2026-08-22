from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=2)
    role: Optional[str] = "Field Agent"


class UserLoginRequest(BaseModel):
    email: str  # Can be email or username
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    name: Optional[str] = None  # Alias for frontend compatibility
    username: Optional[str] = None  # Alias for frontend compatibility
    email: str
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    token: Optional[str] = None  # Alias for frontend compatibility
    user: UserResponse
