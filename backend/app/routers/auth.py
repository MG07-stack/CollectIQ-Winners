from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
)
from app.auth.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from app.auth.deps import get_current_user
from app.services.seed_service import seed_user_initial_data

router = APIRouter(prefix="", tags=["Authentication"])


def build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        name=user.full_name,
        username=user.email.split("@")[0],
        email=user.email,
        role=user.role,
        created_at=user.created_at,
    )


@router.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserRegisterRequest, db: Session = Depends(get_db)):
    clean_email = body.email.strip().lower()

    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in or use a different email.",
        )

    if len(body.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    user = User(
        email=clean_email,
        full_name=body.full_name.strip(),
        password_hash=get_password_hash(body.password),
        role=body.role or "Field Agent",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically seed initial starter data for the new user
    seed_user_initial_data(db, user)

    # Generate JWT token
    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    user_resp = build_user_response(user)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        token=token,
        user=user_resp,
    )


@router.post("/api/auth/login", response_model=TokenResponse)
@router.post("/auth/login", response_model=TokenResponse)
def login(body: UserLoginRequest, db: Session = Depends(get_db)):
    login_identifier = body.email.strip().lower()

    user = None
    if "@" in login_identifier:
        user = db.query(User).filter(User.email == login_identifier).first()
    else:
        # Match by email prefix/username e.g. "admin" -> "admin@collectiq.com" or like query
        user = db.query(User).filter(User.email.like(f"{login_identifier}@%")).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials and try again.",
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    user_resp = build_user_response(user)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        token=token,
        user=user_resp,
    )


@router.get("/api/auth/me", response_model=UserResponse)
@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return build_user_response(current_user)


@router.post("/api/auth/logout")
@router.post("/auth/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"success": True, "message": "Successfully logged out."}
