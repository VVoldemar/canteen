from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./test.db"
    
    jwt_secret_key: str = Field(
        default="your-super-secret-key-change-in-production",
        description="Secret key for JWT token signing. MUST be changed in production!"
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    access_ttl_minutes: int = Field(default=30, description="Access token lifetime in minutes")
    refresh_ttl_days: int = Field(default=7, description="Refresh token lifetime in days")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    def validate_jwt_secret(self) -> None:
        """Проверка, что секретный ключ был изменен"""
        if self.jwt_secret_key == "your-super-secret-key-change-in-production":
            import warnings
            warnings.warn(
                "⚠️  WARNING: Using default JWT secret key! "
                "Please set JWT_SECRET_KEY in .env for production!",
                UserWarning,
                stacklevel=2
            )


settings = Settings()
settings.validate_jwt_secret()