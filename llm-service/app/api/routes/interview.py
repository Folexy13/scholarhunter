"""
Interview Prep API Routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.models.requests import InterviewPrepRequest
from app.models.responses import InterviewPrepResponse
from app.core.security import verify_api_key
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/interview-prep", response_model=InterviewPrepResponse)
@limiter.limit("15/minute")
async def interview_prep(
    request: Request,
    interview_request: InterviewPrepRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Interview preparation - generate questions or evaluate answers
    
    **Generate Question Mode:**
    - **mode**: "generate_question"
    - **scholarship_info**: Scholarship information
    - **difficulty**: Optional difficulty level (easy/medium/hard)
    
    **Evaluate Answer Mode:**
    - **mode**: "evaluate_answer"
    - **scholarship_info**: Scholarship information
    - **question**: The interview question
    - **student_answer**: Student's answer to evaluate
    
    Returns:
    - For generate_question: Interview question with tips
    - For evaluate_answer: Detailed feedback and suggestions
    """
    try:
        logger.info(f"Received interview prep request: {interview_request.mode}")
        
        # Get Gemini service from app state
        gemini_service = request.app.state.gemini_service
        
        # Process interview prep
        result = await gemini_service.interview_prep(
            mode=interview_request.mode,
            scholarship_info=interview_request.scholarship_info,
            student_answer=interview_request.student_answer,
            question=interview_request.question
        )
        
        logger.info(f"Interview prep ({interview_request.mode}) completed successfully")
        
        return InterviewPrepResponse(
            success=True,
            data=result
        )
        
    except ValueError as e:
        logger.warning(f"Validation error in interview prep: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in interview prep: {e}", exc_info=True)
        return InterviewPrepResponse(
            success=False,
            error=f"Failed to process interview prep: {str(e)}"
        )
