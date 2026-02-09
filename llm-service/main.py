"""
ScholarHunter LLM Service
FastAPI application for AI-powered scholarship matching and document generation
Following OWASP security best practices
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.security import verify_api_key
from app.api.routes import cv_parser, scholarship_matcher, document_generator, chat, interview, scholarship_discovery
from app.core.logging_config import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager"""
    logger.info("Starting LLM Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Service Port: {settings.SERVICE_PORT}")
    
    # Initialize Gemini AI
    from app.services.gemini_service import GeminiService
    gemini_service = GeminiService()
    await gemini_service.initialize()
    app.state.gemini_service = gemini_service
    
    logger.info("LLM Service started successfully")
    
    yield
    
    logger.info("Shutting down LLM Service...")
    await gemini_service.cleanup()
    logger.info("LLM Service shut down successfully")


# Create FastAPI app
app = FastAPI(
    title="ScholarHunter LLM Service",
    description="AI-powered scholarship matching and document generation service",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Security Headers Middleware
# OWASP: Security Misconfiguration
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Enable XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Content Security Policy
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    # Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Permissions Policy
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    return response


# Request Logging Middleware
# OWASP: Insufficient Logging & Monitoring
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else "unknown",
        }
    )
    
    response = await call_next(request)
    
    logger.info(
        f"Response: {response.status_code}",
        extra={
            "status_code": response.status_code,
            "path": request.url.path,
        }
    )
    
    return response


# Exception Handlers
# OWASP: Sensitive Data Exposure
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors without exposing sensitive data"""
    logger.warning(
        f"Validation error: {exc}",
        extra={"path": request.url.path}
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Invalid request data",
            "details": exc.errors() if settings.ENVIRONMENT == "development" else None,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions without exposing sensitive data"""
    logger.error(
        f"Unhandled exception: {exc}",
        extra={"path": request.url.path},
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "details": str(exc) if settings.ENVIRONMENT == "development" else None,
        },
    )


# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "llm-service",
        "version": "1.0.0",
    }


# API Routes
app.include_router(cv_parser.router, prefix="/api/llm", tags=["CV Parser"])
app.include_router(scholarship_matcher.router, prefix="/api/llm", tags=["Scholarship Matcher"])
app.include_router(scholarship_discovery.router, prefix="/api/llm/scholarships", tags=["Scholarship Discovery"])
app.include_router(document_generator.router, prefix="/api/llm", tags=["Document Generator"])
app.include_router(chat.router, prefix="/api/llm", tags=["Chat"])
app.include_router(interview.router, prefix="/api/llm", tags=["Interview Prep"])


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "service": "ScholarHunter LLM Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.ENVIRONMENT == "development" else "disabled",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.SERVICE_PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
    )
