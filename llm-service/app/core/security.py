"""
Security utilities following OWASP best practices
"""

import hashlib
import hmac
import secrets
import re
from typing import Optional
from datetime import datetime, timedelta

from fastapi import Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings


# OWASP: Broken Access Control
security = HTTPBearer()


def verify_api_key(authorization: Optional[str] = Header(None)) -> bool:
    """
    Verify API key from Core API
    OWASP: Broken Authentication
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
            )
        
        # Constant-time comparison to prevent timing attacks
        if not secrets.compare_digest(token, settings.CORE_API_SECRET):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
            )
        
        return True
    
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )


def verify_request_signature(
    payload: str,
    signature: str,
    secret: str = settings.CORE_API_SECRET
) -> bool:
    """
    Verify HMAC signature of request payload
    OWASP: Insecure Deserialization
    """
    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return secrets.compare_digest(signature, expected_signature)


def generate_request_signature(payload: str, secret: str = settings.CORE_API_SECRET) -> str:
    """Generate HMAC signature for request payload"""
    return hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()


# OWASP: Injection - Input Sanitization
def sanitize_input(text: str, max_length: int = 10000) -> str:
    """
    Sanitize user input to prevent injection attacks
    - Remove potentially dangerous characters
    - Limit length
    - Remove control characters
    """
    if not text:
        return ""
    
    # Truncate to max length
    text = text[:max_length]
    
    # Remove control characters except newlines and tabs
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    
    # Remove potential script tags
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove potential SQL injection patterns
    sql_patterns = [
        r'(\bUNION\b.*\bSELECT\b)',
        r'(\bDROP\b.*\bTABLE\b)',
        r'(\bINSERT\b.*\bINTO\b)',
        r'(\bDELETE\b.*\bFROM\b)',
        r'(\bUPDATE\b.*\bSET\b)',
    ]
    for pattern in sql_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text.strip()


def validate_file_type(filename: str) -> bool:
    """
    Validate file type based on extension
    OWASP: Injection
    """
    if not filename:
        return False
    
    # Get file extension
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    
    return ext in settings.allowed_file_types_list


def validate_file_size(file_size: int) -> bool:
    """
    Validate file size
    OWASP: Injection
    """
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024  # Convert to bytes
    return 0 < file_size <= max_size


# OWASP: Sensitive Data Exposure
def mask_sensitive_data(data: str, visible_chars: int = 4) -> str:
    """
    Mask sensitive data for logging
    Shows only first and last few characters
    """
    if not data or len(data) <= visible_chars * 2:
        return "***"
    
    return f"{data[:visible_chars]}...{data[-visible_chars:]}"


def validate_prompt_length(prompt: str) -> bool:
    """
    Validate prompt length to prevent abuse
    OWASP: Injection
    """
    return 0 < len(prompt) <= settings.MAX_PROMPT_LENGTH


# OWASP: Security Misconfiguration
class SecurityHeaders:
    """Security headers for responses"""
    
    @staticmethod
    def get_headers() -> dict:
        """Get security headers"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        }


# OWASP: Insufficient Logging & Monitoring
def create_audit_log(
    action: str,
    user_id: Optional[str] = None,
    resource: Optional[str] = None,
    status: str = "success",
    details: Optional[dict] = None,
) -> dict:
    """
    Create audit log entry
    """
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "user_id": user_id,
        "resource": resource,
        "status": status,
        "details": details or {},
    }


# Rate limiting helper
class RateLimitTracker:
    """Track rate limits per user/IP"""
    
    def __init__(self):
        self._requests = {}
    
    def is_rate_limited(self, identifier: str, limit: int, window_seconds: int) -> bool:
        """
        Check if identifier has exceeded rate limit
        OWASP: Insufficient Logging & Monitoring
        """
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window_seconds)
        
        # Clean old entries
        if identifier in self._requests:
            self._requests[identifier] = [
                ts for ts in self._requests[identifier]
                if ts > window_start
            ]
        else:
            self._requests[identifier] = []
        
        # Check limit
        if len(self._requests[identifier]) >= limit:
            return True
        
        # Add current request
        self._requests[identifier].append(now)
        return False


# Input validation patterns
class ValidationPatterns:
    """Common validation patterns"""
    
    EMAIL = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    UUID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    ALPHANUMERIC = re.compile(r'^[a-zA-Z0-9_-]+$')
    
    @staticmethod
    def is_valid_email(email: str) -> bool:
        """Validate email format"""
        return bool(ValidationPatterns.EMAIL.match(email))
    
    @staticmethod
    def is_valid_uuid(uuid: str) -> bool:
        """Validate UUID format"""
        return bool(ValidationPatterns.UUID.match(uuid))
    
    @staticmethod
    def is_alphanumeric(text: str) -> bool:
        """Validate alphanumeric string"""
        return bool(ValidationPatterns.ALPHANUMERIC.match(text))
