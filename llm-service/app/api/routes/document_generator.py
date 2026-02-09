"""
Document Generator API Routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.models.requests import DocumentGenerateRequest
from app.models.responses import DocumentGenerateResponse
from app.core.security import verify_api_key
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/generate-document", response_model=DocumentGenerateResponse)
@limiter.limit("5/minute")
async def generate_document(
    request: Request,
    doc_request: DocumentGenerateRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Generate scholarship application document using AI
    
    - **document_type**: Type of document (SOP, personal_statement, etc.)
    - **student_profile**: Student's profile data
    - **scholarship_info**: Scholarship information
    - **additional_context**: Optional additional context
    - **word_limit**: Optional word limit
    
    Returns generated document with:
    - Document content
    - Word count
    - Key themes
    - Strengths
    - Suggestions for improvement
    """
    try:
        logger.info(f"Received document generation request for {doc_request.document_type}")
        
        # Get Gemini service from app state
        gemini_service = request.app.state.gemini_service
        
        # Generate document
        document = await gemini_service.generate_document(
            document_type=doc_request.document_type,
            student_profile=doc_request.student_profile,
            scholarship_info=doc_request.scholarship_info,
            additional_context=doc_request.additional_context
        )
        
        logger.info(f"Document generated successfully: {doc_request.document_type}")
        
        return DocumentGenerateResponse(
            success=True,
            document=document
        )
        
    except ValueError as e:
        logger.warning(f"Validation error in document generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating document: {e}", exc_info=True)
        return DocumentGenerateResponse(
            success=False,
            error=f"Failed to generate document: {str(e)}"
        )
