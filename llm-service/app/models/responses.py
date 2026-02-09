"""
Response models for LLM Service API
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class CVParseResponse(BaseModel):
    """Response model for CV parsing"""
    success: bool = Field(..., description="Whether parsing was successful")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Parsed CV data")
    error: Optional[str] = Field(default=None, description="Error message if failed")


class ScholarshipMatchResponse(BaseModel):
    """Response model for scholarship matching"""
    success: bool = Field(..., description="Whether matching was successful")
    matches: Optional[List[Dict[str, Any]]] = Field(default=None, description="List of matched scholarships")
    total_matches: Optional[int] = Field(default=None, description="Total number of matches")
    error: Optional[str] = Field(default=None, description="Error message if failed")


class DocumentGenerateResponse(BaseModel):
    """Response model for document generation"""
    success: bool = Field(..., description="Whether generation was successful")
    document: Optional[Dict[str, Any]] = Field(default=None, description="Generated document data")
    error: Optional[str] = Field(default=None, description="Error message if failed")


class ChatResponse(BaseModel):
    """Response model for chat"""
    success: bool = Field(..., description="Whether chat was successful")
    response: Optional[Dict[str, Any]] = Field(default=None, description="Chat response data")
    error: Optional[str] = Field(default=None, description="Error message if failed")


class InterviewPrepResponse(BaseModel):
    """Response model for interview preparation"""
    success: bool = Field(..., description="Whether operation was successful")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Question or evaluation data")
    error: Optional[str] = Field(default=None, description="Error message if failed")


class ScholarshipDiscoveryResponse(BaseModel):
    """Response model for scholarship discovery"""
    scholarships: List[Dict[str, Any]] = Field(..., description="List of discovered scholarships")
    count: int = Field(..., description="Number of scholarships discovered")


class ErrorResponse(BaseModel):
    """Generic error response"""
    error: str = Field(..., description="Error message")
    details: Optional[Any] = Field(default=None, description="Additional error details")
    status_code: int = Field(..., description="HTTP status code")
