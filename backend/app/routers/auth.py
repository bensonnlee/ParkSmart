from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, security
from app.models import User
from app.schemas import (
    AuthResponse,
    AuthTokens,
    LoginRequest,
    LogoutResponse,
    RefreshTokenRequest,
    SignUpRequest,
    UserResponse,
)
from app.services import auth as auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _build_tokens(session) -> AuthTokens:
    """Build AuthTokens from a Supabase session."""
    return AuthTokens(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password."""
    try:
        response = await auth_service.sign_up(request.email, request.password)

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user",
            )

        user = User(
            supabase_id=response.user.id,
            email=response.user.email,
            display_name=request.display_name,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        return AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=_build_tokens(response.session),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    try:
        response = await auth_service.sign_in(request.email, request.password)

        if not response.user or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        result = await db.execute(
            select(User).where(User.supabase_id == response.user.id)
        )
        user = result.scalar_one_or_none()

        if not user:
            # Create local user if doesn't exist (e.g., migrated from Supabase)
            user = User(
                supabase_id=response.user.id,
                email=response.user.email,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        return AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=_build_tokens(response.session),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _user: User = Depends(get_current_user),
):
    """Logout and invalidate the current session."""
    # Even if Supabase sign out fails, we consider it logged out
    try:
        await auth_service.sign_out(credentials.credentials)
    except Exception:
        pass
    return LogoutResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return UserResponse.model_validate(user)


@router.post("/refresh", response_model=AuthTokens)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token."""
    try:
        response = await auth_service.refresh_session(request.refresh_token)

        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        return _build_tokens(response.session)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
