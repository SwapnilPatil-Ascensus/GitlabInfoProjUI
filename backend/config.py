"""
Configuration management for the application.
Centralizes all configuration settings and environment variables.
"""
import os
from typing import List, Optional
from functools import lru_cache


class Settings:
    """Application settings loaded from environment variables."""
    
    # GitLab Configuration
    GITLAB_TOKEN: str = os.environ.get("GITLAB_TOKEN", "")
    GITLAB_BASE_URL: str = os.environ.get("GITLAB_BASE_URL", "https://gitlab.com")
    GITLAB_VERIFY_SSL: bool = os.environ.get("GITLAB_VERIFY_SSL", "false").lower() == "true"
    
    # API Configuration
    API_PORT: int = int(os.environ.get("PORT", "8000"))
    API_HOST: str = os.environ.get("HOST", "0.0.0.0")
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = os.environ.get(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:3001"
    ).split(",")
    
    # Caching Configuration
    CACHE_ENABLED: bool = os.environ.get("CACHE_ENABLED", "true").lower() == "true"
    CACHE_TTL: int = int(os.environ.get("CACHE_TTL", "300"))  # 5 minutes default
    
    # Logging Configuration
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 100
    MAX_PAGE_SIZE: int = 100
    
    @classmethod
    def validate(cls) -> None:
        """Validate that required settings are present."""
        if not cls.GITLAB_TOKEN:
            raise ValueError(
                "GITLAB_TOKEN environment variable is required. "
                "Please set it before starting the application."
            )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    settings = Settings()
    # Don't validate at import time - let startup event handle it
    return settings
