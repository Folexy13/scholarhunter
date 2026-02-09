"""
Configuration settings for LLM Service
OWASP: Security Misconfiguration - Centralized configuration management
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    SERVICE_PORT: int = Field(default=10000, env="PORT")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Gemini AI Configuration
    GEMINI_API_KEY: str = Field(..., env="GEMINI_API_KEY")
    GEMINI_MODEL: str = Field(default="gemini-3.0-pro", env="GEMINI_MODEL")
    
    # Security - OWASP: Broken Access Control
    CORE_API_URL: str = Field(default="http://core-api:3000", env="CORE_API_URL")
    CORE_API_SECRET: str = Field(..., env="CORE_API_SECRET")
    ALLOWED_HOSTS: str = Field(
        default="*",  # Allow all hosts in Docker environment
        env="ALLOWED_HOSTS"
    )
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://core-api:3000",
        env="CORS_ORIGINS"
    )
    
    # Rate Limiting - OWASP: Insufficient Logging & Monitoring
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    RATE_LIMIT_PER_HOUR: int = Field(default=1000, env="RATE_LIMIT_PER_HOUR")
    
    # Request Timeouts
    REQUEST_TIMEOUT: int = Field(default=30, env="REQUEST_TIMEOUT")
    GEMINI_TIMEOUT: int = Field(default=60, env="GEMINI_TIMEOUT")
    
    # File Upload Limits - OWASP: Injection
    MAX_FILE_SIZE_MB: int = Field(default=10, env="MAX_FILE_SIZE_MB")
    ALLOWED_FILE_TYPES: str = Field(
        default="pdf,doc,docx,txt",
        env="ALLOWED_FILE_TYPES"
    )
    
    # Prompt Configuration
    MAX_PROMPT_LENGTH: int = Field(default=10000, env="MAX_PROMPT_LENGTH")
    MAX_RESPONSE_TOKENS: int = Field(default=4096, env="MAX_RESPONSE_TOKENS")
    
    # Cache Configuration
    ENABLE_CACHE: bool = Field(default=True, env="ENABLE_CACHE")
    CACHE_TTL_SECONDS: int = Field(default=3600, env="CACHE_TTL_SECONDS")
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        """Validate environment value"""
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of {allowed}")
        return v
    
    @validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        """Validate log level"""
        allowed = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed:
            raise ValueError(f"LOG_LEVEL must be one of {allowed}")
        return v.upper()
    
    @validator("GEMINI_API_KEY")
    def validate_api_key(cls, v):
        """Validate API key is not empty"""
        if not v or len(v) < 10:
            raise ValueError("GEMINI_API_KEY must be a valid API key")
        return v
    
    @property
    def allowed_hosts_list(self) -> List[str]:
        """Get ALLOWED_HOSTS as a list"""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS_ORIGINS as a list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def allowed_file_types_list(self) -> List[str]:
        """Get ALLOWED_FILE_TYPES as a list"""
        return [ft.strip() for ft in self.ALLOWED_FILE_TYPES.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create settings instance
settings = Settings()
