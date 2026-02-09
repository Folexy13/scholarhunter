"""
Scholarship Discovery API Route
Discovers real, ongoing scholarship opportunities using Gemini AI
"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.requests import ScholarshipDiscoveryRequest
from app.models.responses import ScholarshipDiscoveryResponse
from app.services.gemini_service import GeminiService
from app.core.security import verify_api_key
import logging
import json

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/discover", response_model=ScholarshipDiscoveryResponse)
async def discover_scholarships(
    request: ScholarshipDiscoveryRequest,
    _: bool = Depends(verify_api_key)
):
    """
    Discover real, ongoing scholarship opportunities
    
    Uses Gemini AI to find and extract information about current scholarship programs
    from its knowledge base.
    """
    try:
        logger.info(f"Discovering {request.count} scholarships")
        
        gemini_service = GeminiService()
        await gemini_service.initialize()
        
        # Load instructions from YAML
        import yaml
        import os
        instructions_path = os.path.join(os.path.dirname(__file__), "../../instructions/scholarship_discovery.yaml")
        with open(instructions_path, 'r') as f:
            instructions = yaml.safe_load(f)
        
        # Build the prompt with current date context
        from datetime import datetime
        current_date = datetime.now().strftime("%B %d, %Y")
        current_year = datetime.now().year
        
        system_prompt = instructions.get("system_prompt", "")
        
        # Add explicit date context to the user prompt
        date_context = f"\n\n🚨 CRITICAL DATE REQUIREMENTS 🚨\n- TODAY'S DATE: {current_date}\n- CURRENT YEAR: {current_year}\n- ALL deadlines MUST be in {current_year} or {current_year + 1}\n- NEVER use {current_year - 2} or {current_year - 1} dates\n- Example valid deadlines: {current_year}-10-31, {current_year + 1}-03-15\n"
        
        user_prompt = f"{date_context}\n\nFind {request.count} real, ongoing scholarship opportunities with deadlines in {current_year} or {current_year + 1}. Return ONLY a JSON object with this exact structure: {{\"scholarships\": [{{\"title\": \"...\", \"provider\": \"...\", \"country\": \"...\", \"educationLevel\": \"...\", \"fieldOfStudy\": \"...\", \"amount\": \"...\", \"currency\": \"...\", \"deadline\": \"YYYY-MM-DD\" (MUST be {current_year} or {current_year + 1}), \"description\": \"...\", \"eligibilityCriteria\": [\"...\"], \"applicationUrl\": \"...\", \"isActive\": true}}]}}"
        
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # Call Gemini with higher token limit for complete JSON
        result = await gemini_service._generate_content(
            prompt=full_prompt,
            temperature=0.7,
            max_tokens=8192  # Increased to ensure complete JSON response
        )
        
        # Parse the JSON response
        try:
            # Extract JSON from markdown code blocks if present
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0].strip()
            elif "```" in result:
                result = result.split("```")[1].split("```")[0].strip()
            
            scholarships_data = json.loads(result)
            scholarships = scholarships_data.get("scholarships", [])
            
            logger.info(f"Successfully discovered {len(scholarships)} scholarships")
            
            return ScholarshipDiscoveryResponse(
                scholarships=scholarships,
                count=len(scholarships)
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse scholarship data: {e}")
            logger.error(f"Raw response: {result}")
            raise HTTPException(
                status_code=500,
                detail="Failed to parse scholarship data from AI response"
            )
            
    except Exception as e:
        logger.error(f"Error discovering scholarships: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to discover scholarships: {str(e)}"
        )
