from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from gotrue.types import Session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, security
from app.models import User
from app.config import get_settings
from app.schemas import (
    AuthResponse,
    AuthTokens,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LogoutResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    SignUpRequest,
    UserResponse,
)
from app.services import auth as auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _build_tokens(session: Session) -> AuthTokens:
    """Build AuthTokens from a Supabase session."""
    return AuthTokens(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest, db: DbSession) -> AuthResponse:
    """Register a new user with email and password."""
    try:
        response = await auth_service.sign_up(request.email, request.password)

        if not response.user or not response.session:
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
        ) from e


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: DbSession) -> AuthResponse:
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
        ) from None


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    _user: CurrentUser,
) -> LogoutResponse:
    """Logout and invalidate the current session."""
    # Even if Supabase sign out fails, we consider it logged out
    try:
        await auth_service.sign_out(credentials.credentials)
    except Exception:
        pass
    return LogoutResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_me(user: CurrentUser) -> UserResponse:
    """Get current authenticated user info."""
    return UserResponse.model_validate(user)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(request: ForgotPasswordRequest) -> ForgotPasswordResponse:
    """Send a password reset email if the account exists."""
    try:
        settings = get_settings()
        redirect_url = f"{settings.frontend_url.rstrip('/')}/reset-password"
        await auth_service.reset_password(request.email, redirect_url)
    except Exception:
        logger.warning("Failed to send password reset email", exc_info=True)
    return ForgotPasswordResponse(
        message="If an account exists with that email, a password reset link has been sent"
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(request: ResetPasswordRequest) -> ResetPasswordResponse:
    """Reset password using tokens from the email reset link."""
    try:
        await auth_service.update_password(
            request.access_token, request.refresh_token, request.new_password
        )
        return ResetPasswordResponse(
            message="Password has been reset successfully"
        )
    except Exception:
        logger.warning("Password reset failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        ) from None


@router.post("/refresh", response_model=AuthTokens)
async def refresh_token(request: RefreshTokenRequest) -> AuthTokens:
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
        ) from None
