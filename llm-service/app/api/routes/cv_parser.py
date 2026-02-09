"""
CV Parser API Routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.models.requests import CVParseRequest
from app.models.responses import CVParseResponse
from app.core.security import verify_api_key
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/parse-cv", response_model=CVParseResponse)
@limiter.limit("10/minute")
async def parse_cv(
    request: Request,
    cv_request: CVParseRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Parse CV/Resume and extract structured data
    
    - **cv_text**: Raw CV/Resume text content
    
    Returns structured data including:
    - Personal information
    - Education history
    - Work experience
    - Skills
    - Projects
    - Publications
    - Awards
    """
    try:
        logger.info("Received CV parse request")
        
        # Get Gemini service from app state
        gemini_service = request.app.state.gemini_service
        
        # Parse CV
        parsed_data = await gemini_service.parse_cv(cv_request.cv_text)
        
        logger.info("CV parsed successfully")
        
        return CVParseResponse(
            success=True,
            data=parsed_data
        )
        
    except ValueError as e:
        logger.warning(f"Validation error in CV parsing: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error parsing CV: {e}", exc_info=True)
        return CVParseResponse(
            success=False,
            error=f"Failed to parse CV: {str(e)}"
        )
