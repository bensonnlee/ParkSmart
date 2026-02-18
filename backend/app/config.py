from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str

    # UCR API endpoint
    ucr_api_url: str = "https://lotspaces.ucr.edu/api/lots"

    # Supabase Auth
    supabase_url: str
    supabase_anon_key: str

    # Python version
    python_version: str = "3.12.10"
    
    # Frontend URL (used for password reset redirect)
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
