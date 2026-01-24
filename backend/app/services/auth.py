import asyncio
from functools import lru_cache
from typing import Optional

from supabase import create_client, Client

from app.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Get cached Supabase client instance."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


async def sign_up(email: str, password: str) -> dict:
    """Register a new user with Supabase Auth."""
    client = get_supabase_client()
    response = await asyncio.to_thread(
        client.auth.sign_up,
        {"email": email, "password": password}
    )
    return response


async def sign_in(email: str, password: str) -> dict:
    """Sign in user with email and password."""
    client = get_supabase_client()
    response = await asyncio.to_thread(
        client.auth.sign_in_with_password,
        {"email": email, "password": password}
    )
    return response


async def sign_out(access_token: str) -> None:
    """Sign out user and invalidate session."""
    client = get_supabase_client()
    # Set the session before signing out
    await asyncio.to_thread(
        client.auth.set_session,
        access_token,
        ""  # refresh_token not needed for sign out
    )
    await asyncio.to_thread(client.auth.sign_out)


async def refresh_session(refresh_token: str) -> dict:
    """Refresh access token using refresh token."""
    client = get_supabase_client()
    response = await asyncio.to_thread(
        client.auth.refresh_session,
        refresh_token
    )
    return response


async def get_user(access_token: str) -> Optional[dict]:
    """Get user info from access token."""
    client = get_supabase_client()
    response = await asyncio.to_thread(
        client.auth.get_user,
        access_token
    )
    return response
