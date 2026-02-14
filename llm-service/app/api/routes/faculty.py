"""
Faculty Discovery API Routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.models.requests import FacultyDiscoveryRequest
from app.core.security import verify_api_key
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/discover", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def discover_faculty(
    request: Request,
    faculty_request: FacultyDiscoveryRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Discover universities and faculty based on region and department
    """
    try:
        logger.info(f"Received faculty discovery request: {faculty_request.mode}")
        
        # Get Gemini service from app state
        gemini_service = request.app.state.gemini_service
        
        # Get discovery response
        result = await gemini_service.discover_faculty(
            mode=faculty_request.mode,
            continent=faculty_request.continent,
            university=faculty_request.university,
            department=faculty_request.department,
            student_profile=faculty_request.student_profile
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error in faculty discovery: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
