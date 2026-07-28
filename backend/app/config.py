from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # AWS S3
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str
    s3_bucket_name: str

    # Embeddings
    embedding_model_name: str = "openai/clip-vit-base-patch32"

    # Presigned uploads
    presign_expiry_seconds: int = 300

    # External teammate API
    product_api_url: str = ""
    product_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
