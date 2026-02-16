from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str

    # UCR API endpoint
    ucr_api_url: str = "https://lotspaces.ucr.edu/api/lots"

    # Supabase Auth
    supabase_url: str
    supabase_anon_key: str

    # Mapbox
    mapbox_access_token: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
