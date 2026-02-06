from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.services.auth import get_supabase_client

security = HTTPBearer(auto_error=False)

AUTH_HEADERS = {"WWW-Authenticate": "Bearer"}


def _auth_error(detail: str) -> HTTPException:
    """Create a 401 Unauthorized error with proper headers."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers=AUTH_HEADERS,
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Validate JWT and return the current user. Raises 401 if invalid."""
    if not credentials:
        raise _auth_error("Missing authentication token")

    try:
        response = get_supabase_client().auth.get_user(credentials.credentials)
        supabase_user = response.user if response else None
        if not supabase_user:
            raise _auth_error("Invalid authentication token")
    except HTTPException:
        raise
    except Exception:
        raise _auth_error("Invalid authentication token") from None

    result = await db.execute(select(User).where(User.supabase_id == supabase_user.id))
    user = result.scalar_one_or_none()

    if not user:
        raise _auth_error("User not found")

    return user


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    """Return current user if authenticated, None otherwise."""
    if not credentials:
        return None

    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
