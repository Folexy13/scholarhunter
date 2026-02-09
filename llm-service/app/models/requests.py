"""
Request models for LLM Service API
OWASP: Input Validation
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator


class CVParseRequest(BaseModel):
    """Request model for CV parsing"""
    cv_text: str = Field(..., min_length=10, max_length=50000, description="CV/Resume text content")
    
    @validator("cv_text")
    def validate_cv_text(cls, v):
        """Validate CV text is not empty"""
        if not v or not v.strip():
            raise ValueError("CV text cannot be empty")
        return v.strip()


class ScholarshipMatchRequest(BaseModel):
    """Request model for scholarship matching"""
    student_profile: Dict[str, Any] = Field(..., description="Student profile data")
    scholarships: List[Dict[str, Any]] = Field(..., min_items=1, max_items=100, description="List of scholarships to match")
    
    @validator("scholarships")
    def validate_scholarships(cls, v):
        """Validate scholarships list"""
        if not v:
            raise ValueError("Scholarships list cannot be empty")
        return v


class DocumentGenerateRequest(BaseModel):
    """Request model for document generation"""
    document_type: str = Field(..., description="Type of document to generate")
    student_profile: Dict[str, Any] = Field(..., description="Student profile data")
    scholarship_info: Dict[str, Any] = Field(..., description="Scholarship information")
    additional_context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    word_limit: Optional[int] = Field(default=None, ge=100, le=5000, description="Word limit for document")
    
    @validator("document_type")
    def validate_document_type(cls, v):
        """Validate document type"""
        allowed_types = [
            "statement_of_purpose",
            "personal_statement",
            "cover_letter",
            "motivation_letter",
            "research_proposal",
            "diversity_statement",
            "leadership_essay"
        ]
        if v.lower() not in allowed_types:
            raise ValueError(f"Document type must be one of: {', '.join(allowed_types)}")
        return v.lower()


class ChatRequest(BaseModel):
    """Request model for chat"""
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=None, description="Previous conversation")
    attachments: Optional[List[Dict[str, Any]]] = Field(default=None, description="File attachments (base64 and mime_type)")
    
    @validator("message")
    def validate_message(cls, v):
        """Validate message is not empty"""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()
    
    @validator("conversation_history")
    def validate_history(cls, v):
        """Validate conversation history format"""
        if v is not None:
            for msg in v:
                if "role" not in msg or "content" not in msg:
                    raise ValueError("Each message must have 'role' and 'content' fields")
                if msg["role"] not in ["user", "assistant"]:
                    raise ValueError("Role must be 'user' or 'assistant'")
        return v


class InterviewPrepRequest(BaseModel):
    """Request model for interview preparation"""
    mode: str = Field(..., description="Mode: 'generate_question' or 'evaluate_answer'")
    scholarship_info: Dict[str, Any] = Field(..., description="Scholarship information")
    question: Optional[str] = Field(default=None, description="Interview question (for evaluation)")
    student_answer: Optional[str] = Field(default=None, max_length=5000, description="Student's answer (for evaluation)")
    difficulty: Optional[str] = Field(default="medium", description="Question difficulty")
    
    @validator("mode")
    def validate_mode(cls, v):
        """Validate mode"""
        if v not in ["generate_question", "evaluate_answer"]:
            raise ValueError("Mode must be 'generate_question' or 'evaluate_answer'")
        return v
    
    @validator("difficulty")
    def validate_difficulty(cls, v):
        """Validate difficulty"""
        if v and v.lower() not in ["easy", "medium", "hard"]:
            raise ValueError("Difficulty must be 'easy', 'medium', or 'hard'")
        return v.lower() if v else "medium"
    
    @validator("student_answer")
    def validate_answer_for_evaluation(cls, v, values):
        """Validate answer is provided for evaluation mode"""
        if values.get("mode") == "evaluate_answer" and not v:
            raise ValueError("student_answer is required for evaluation mode")
        return v
    
    @validator("question")
    def validate_question_for_evaluation(cls, v, values):
        """Validate question is provided for evaluation mode"""
        if values.get("mode") == "evaluate_answer" and not v:
            raise ValueError("question is required for evaluation mode")
        return v


class ScholarshipDiscoveryRequest(BaseModel):
    """Request model for scholarship discovery"""
    count: int = Field(default=10, ge=1, le=50, description="Number of scholarships to discover")
    
    @validator("count")
    def validate_count(cls, v):
        """Validate count is reasonable"""
        if v < 1 or v > 50:
            raise ValueError("Count must be between 1 and 50")
        return v
