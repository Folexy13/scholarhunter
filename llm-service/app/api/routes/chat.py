"""
Chat API Routes
"""

import logging
import json
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse

from app.models.requests import ChatRequest
from app.models.responses import ChatResponse
from app.core.security import verify_api_key
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Chat with AI assistant about scholarships and applications
    
    - **message**: User's message
    - **conversation_history**: Optional previous conversation
    
    Returns:
    - AI response message
    - Suggestions and action items
    - Relevant resources
    - Follow-up questions
    """
    try:
        logger.info("Received chat request")
        
        # Get Gemini service from app state
        gemini_service = request.app.state.gemini_service
        
        # Get chat response
        chat_response = await gemini_service.chat(
            message=chat_request.message,
            conversation_history=chat_request.conversation_history,
            attachments=chat_request.attachments
        )
        
        logger.info("Chat response generated successfully")
        
        return ChatResponse(
            success=True,
            response=chat_response
        )
        
    except ValueError as e:
        logger.warning(f"Validation error in chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in chat: {e}", exc_info=True)
        return ChatResponse(
            success=False,
            error=f"Failed to process chat: {str(e)}"
        )


@router.post("/chat/stream")
@limiter.limit("30/minute")
async def chat_stream(
    request: Request,
    chat_request: ChatRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Stream chat response from AI assistant
    
    Returns Server-Sent Events (SSE) stream with chunks of the response
    """
    async def generate():
        try:
            logger.info("Received streaming chat request")
            
            # Get Gemini service from app state
            gemini_service = request.app.state.gemini_service
            
            # Stream chat response
            async for chunk in gemini_service.chat_stream(
                message=chat_request.message,
                conversation_history=chat_request.conversation_history,
                attachments=chat_request.attachments
            ):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            
            # Send done signal
            yield "data: [DONE]\n\n"
            
            logger.info("Streaming chat response completed")
            
        except Exception as e:
            logger.error(f"Error in streaming chat: {e}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
