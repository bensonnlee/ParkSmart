from __future__ import annotations

import asyncio
from functools import lru_cache

from gotrue.types import AuthResponse as GoTrueAuthResponse
from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Get cached Supabase client instance."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


async def sign_up(email: str, password: str) -> GoTrueAuthResponse:
    """Register a new user with Supabase Auth."""
    return await asyncio.to_thread(
        get_supabase_client().auth.sign_up, {"email": email, "password": password}
    )


async def sign_in(email: str, password: str) -> GoTrueAuthResponse:
    """Sign in user with email and password."""
    return await asyncio.to_thread(
        get_supabase_client().auth.sign_in_with_password,
        {"email": email, "password": password},
    )


async def sign_out(access_token: str) -> None:
    """Sign out user and invalidate session."""
    client = get_supabase_client()
    await asyncio.to_thread(client.auth.set_session, access_token, "")
    await asyncio.to_thread(client.auth.sign_out)


async def refresh_session(refresh_token: str) -> GoTrueAuthResponse:
    """Refresh access token using refresh token."""
    return await asyncio.to_thread(
        get_supabase_client().auth.refresh_session, refresh_token
    )
