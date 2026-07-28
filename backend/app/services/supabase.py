from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Server-side Supabase client authenticated with the service role key.

    Only import/use this from trusted backend code (routers, scripts) — the
    service role key bypasses Row Level Security.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
