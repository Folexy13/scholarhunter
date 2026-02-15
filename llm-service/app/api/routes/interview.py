"""
Interview Preparation API Routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.models.requests import InterviewPrepRequest, InterviewPersonaRequest
from app.models.responses import InterviewPrepResponse
from app.core.security import verify_api_key
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/practice", response_model=InterviewPrepResponse)
@limiter.limit("5/minute")
async def practice_interview(
    request: Request,
    prep_request: InterviewPrepRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Practice interview with AI coach
    """
    try:
        logger.info(f"Received interview prep request: {prep_request.mode}")
        
        # Get Gemini service from app state
        gemini_service = request.app.state.gemini_service
        
        # Get feedback or question
        result = await gemini_service.interview_prep(
            mode=prep_request.mode,
            scholarship_info=prep_request.scholarship_info,
            student_answer=prep_request.student_answer,
            question=prep_request.question
        )
        
        return InterviewPrepResponse(
            success=True,
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error in interview prep: {e}", exc_info=True)
        return InterviewPrepResponse(
            success=False,
            error=f"Failed to process interview prep: {str(e)}"
        )


@router.post("/interactive", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def interactive_interview(
    request: Request,
    interview_request: InterviewPersonaRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Conduct an interactive mock interview session with a specific persona
    """
    try:
        logger.info(f"Received interactive interview request: {interview_request.mode} ({interview_request.persona}), is_conclusion={interview_request.is_conclusion}")
        
        # Get Gemini service from app state
        gemini_service = request.app.state.gemini_service
        
        # Get interview response
        result = await gemini_service.conduct_interview(
            mode=interview_request.mode,
            persona=interview_request.persona,
            interview_type=interview_request.interview_type,
            user_answer=interview_request.user_answer,
            history=interview_request.history,
            student_profile=interview_request.student_profile,
            selected_panelists=interview_request.selected_panelists,
            is_conclusion=interview_request.is_conclusion
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error in interactive interview: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
