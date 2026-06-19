"""
Authentication routes.

Handles login, logout, and current user endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse, RegisterRequest, RegisterResponse
from app.services.auth_service import AuthService
from app.services.risk_service import RiskService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and perform risk analysis.

    Returns user data, JWT token, and risk assessment.
    """
    auth_service = AuthService(db)
    risk_service = RiskService(db)

    # Authenticate user
    user = await auth_service.authenticate_user(request.email, request.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Perform risk analysis
    from datetime import datetime
    risk_result = await risk_service.analyze_login_risk(
        user=user,
        device_id=request.device_id,
        device_name=request.device_name,
        browser=request.browser,
        os=request.os,
        city=request.city,
        ip_address=request.ip_address,
        login_time=datetime.utcnow(),
    )

    # Create JWT token
    token = auth_service.create_token(user)

    return LoginResponse(
        message="Login successful",
        user=UserResponse.model_validate(user),
        token=token,
        risk_score=risk_result.risk_score,
        risk_level=risk_result.risk_level,
        risk_reasons=risk_result.risk_reasons,
        recommended_action=risk_result.recommended_action,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user information."""
    return UserResponse.model_validate(current_user)


@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    auth_service = AuthService(db)

    # Check if email already exists
    existing = await auth_service.get_user_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = await auth_service.create_user(
        email=request.email,
        password=request.password,
        name=request.name,
        role="customer",
        phone=request.phone,
        usual_city=request.usual_city,
    )

    # Create JWT token
    token = auth_service.create_token(user)

    return RegisterResponse(
        message="Registration successful",
        user=UserResponse.model_validate(user),
        token=token,
    )
