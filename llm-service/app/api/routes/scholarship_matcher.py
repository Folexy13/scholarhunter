"""
Scholarship Matcher API Routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.models.requests import ScholarshipMatchRequest
from app.models.responses import ScholarshipMatchResponse
from app.core.security import verify_api_key
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/match-scholarships", response_model=ScholarshipMatchResponse)
@limiter.limit("20/minute")
async def match_scholarships(
    request: Request,
    match_request: ScholarshipMatchRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Match student with relevant scholarships using AI
    
    - **student_profile**: Student's profile data
    - **scholarships**: List of available scholarships
    
    Returns list of matched scholarships with:
    - Match score (0-100)
    - Match category (Perfect/Excellent/Good/Fair/Poor)
    - Detailed rationale
    - Strengths and weaknesses
    - Recommendations
    """
    try:
        logger.info(f"Received scholarship match request for {len(match_request.scholarships)} scholarships")
        
        # Get Gemini service from app state
        gemini_service = request.app.state.gemini_service
        
        # Match scholarships
        matches = await gemini_service.match_scholarships(
            student_profile=match_request.student_profile,
            scholarships=match_request.scholarships
        )
        
        logger.info(f"Matched {len(matches)} scholarships successfully")
        
        return ScholarshipMatchResponse(
            success=True,
            matches=matches,
            total_matches=len(matches)
        )
        
    except ValueError as e:
        logger.warning(f"Validation error in scholarship matching: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error matching scholarships: {e}", exc_info=True)
        return ScholarshipMatchResponse(
            success=False,
            error=f"Failed to match scholarships: {str(e)}"
        )
