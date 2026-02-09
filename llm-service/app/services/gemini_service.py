"""
Gemini AI Service
Handles all interactions with Google Gemini 3.0 API
"""

import logging
import json
from typing import Dict, Any, Optional
import google.generativeai as genai

from app.core.config import settings
from app.services.yaml_loader import YAMLInstructionLoader
from app.core.security import sanitize_input

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini AI"""
    
    def __init__(self):
        self.model = None
        self.yaml_loader = YAMLInstructionLoader()
        self._initialized = False
    
    async def initialize(self):
        """Initialize Gemini AI with API key"""
        try:
            # Configure Gemini API
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Initialize model
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            
            self._initialized = True
            logger.info(f"Gemini AI initialized successfully with model: {settings.GEMINI_MODEL}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI: {e}", exc_info=True)
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        self._initialized = False
        logger.info("Gemini AI service cleaned up")
    
    def _ensure_initialized(self):
        """Ensure service is initialized"""
        if not self._initialized:
            raise RuntimeError("Gemini service not initialized. Call initialize() first.")
    
    async def parse_cv(self, cv_text: str) -> Dict[str, Any]:
        """
        Parse CV/Resume text and extract structured data
        
        Args:
            cv_text: Raw CV text
            
        Returns:
            Structured CV data as dictionary
        """
        self._ensure_initialized()
        
        try:
            # Load instructions
            instructions = self.yaml_loader.load_instruction("cv_parser")
            
            # Sanitize input
            cv_text = sanitize_input(cv_text, max_length=settings.MAX_PROMPT_LENGTH)
            
            # Build prompt
            prompt = f"{instructions['system_prompt']}\n\nCV TEXT:\n{cv_text}\n\nExtract the information and return as JSON:"
            
            # Generate response
            response = await self._generate_content(
                prompt=prompt,
                temperature=instructions.get("temperature", 0.3),
                max_tokens=instructions.get("max_tokens", 2048),
            )
            
            # Parse JSON response
            parsed_data = self._parse_json_response(response)
            
            logger.info("CV parsed successfully")
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing CV: {e}", exc_info=True)
            raise
    
    async def match_scholarships(
        self,
        student_profile: Dict[str, Any],
        scholarships: list[Dict[str, Any]]
    ) -> list[Dict[str, Any]]:
        """
        Match student with scholarships using AI
        
        Args:
            student_profile: Student's profile data
            scholarships: List of available scholarships
            
        Returns:
            List of matched scholarships with scores and rationale
        """
        self._ensure_initialized()
        
        try:
            # Load instructions
            instructions = self.yaml_loader.load_instruction("scholarship_matcher")
            
            # Build prompt
            prompt = f"""{instructions['system_prompt']}

STUDENT PROFILE:
{json.dumps(student_profile, indent=2)}

SCHOLARSHIPS TO MATCH:
{json.dumps(scholarships, indent=2)}

Analyze the student profile and match with the most relevant scholarships. Return as JSON array:
"""
            
            # Generate response
            response = await self._generate_content(
                prompt=prompt,
                temperature=instructions.get("temperature", 0.4),
                max_tokens=instructions.get("max_tokens", 3072),
            )
            
            # Parse JSON response
            matches = self._parse_json_response(response)
            
            logger.info(f"Matched {len(matches)} scholarships for student")
            return matches
            
        except Exception as e:
            logger.error(f"Error matching scholarships: {e}", exc_info=True)
            raise
    
    async def generate_document(
        self,
        document_type: str,
        student_profile: Dict[str, Any],
        scholarship_info: Dict[str, Any],
        additional_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate scholarship application document
        
        Args:
            document_type: Type of document (SOP, Personal Statement, etc.)
            student_profile: Student's profile data
            scholarship_info: Scholarship information
            additional_context: Additional context for generation
            
        Returns:
            Generated document with metadata
        """
        self._ensure_initialized()
        
        try:
            # Load instructions
            instructions = self.yaml_loader.load_instruction("document_generator")
            
            # Build prompt
            context = additional_context or {}
            prompt = f"""{instructions['system_prompt']}

DOCUMENT TYPE: {document_type}

STUDENT PROFILE:
{json.dumps(student_profile, indent=2)}

SCHOLARSHIP INFORMATION:
{json.dumps(scholarship_info, indent=2)}

ADDITIONAL CONTEXT:
{json.dumps(context, indent=2)}

Generate a compelling {document_type} and return as JSON:
"""
            
            # Generate response
            response = await self._generate_content(
                prompt=prompt,
                temperature=instructions.get("temperature", 0.7),
                max_tokens=instructions.get("max_tokens", 4096),
            )
            
            # Parse JSON response
            document = self._parse_json_response(response)
            
            logger.info(f"Generated {document_type} successfully")
            return document
            
        except Exception as e:
            logger.error(f"Error generating document: {e}", exc_info=True)
            raise
    
    async def chat(
        self,
        message: str,
        conversation_history: Optional[list[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Chat with AI assistant
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            
        Returns:
            AI response with suggestions and resources
        """
        self._ensure_initialized()
        
        try:
            # Load instructions
            instructions = self.yaml_loader.load_instruction("chat_assistant")
            
            # Sanitize input
            message = sanitize_input(message, max_length=2000)
            
            # Build conversation context
            history_text = ""
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_text += f"{role.upper()}: {content}\n\n"
            
            # Build prompt
            prompt = f"""{instructions['system_prompt']}

CONVERSATION HISTORY:
{history_text}

STUDENT: {message}

Provide a helpful response as JSON:
"""
            
            # Generate response
            response = await self._generate_content(
                prompt=prompt,
                temperature=instructions.get("temperature", 0.6),
                max_tokens=instructions.get("max_tokens", 2048),
            )
            
            # Parse JSON response
            chat_response = self._parse_json_response(response)
            
            logger.info("Chat response generated successfully")
            return chat_response
            
        except Exception as e:
            logger.error(f"Error in chat: {e}", exc_info=True)
            raise
    
    async def chat_stream(
        self,
        message: str,
        conversation_history: Optional[list[Dict[str, str]]] = None
    ):
        """
        Stream chat response from AI assistant
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            
        Yields:
            Chunks of the AI response
        """
        self._ensure_initialized()
        
        try:
            # Load instructions for temperature settings
            instructions = self.yaml_loader.load_instruction("chat_assistant")
            
            # Sanitize input
            message = sanitize_input(message, max_length=2000)
            
            # Build conversation context
            history_text = ""
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_text += f"{role.upper()}: {content}\n\n"
            
            # Build prompt - use the system prompt from YAML
            prompt = f"""{instructions['system_prompt']}

CONVERSATION HISTORY:
{history_text}

STUDENT: {message}

Provide a helpful response as JSON:"""
            
            # Configure generation
            generation_config = genai.types.GenerationConfig(
                temperature=instructions.get("temperature", 0.6),
                max_output_tokens=instructions.get("max_tokens", 2048),
                candidate_count=1,
            )
            
            # Generate streaming response
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config,
                stream=True,
            )
            
            # Yield chunks as they come
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            
            logger.info("Streaming chat response completed")
            
        except Exception as e:
            logger.error(f"Error in streaming chat: {e}", exc_info=True)
            raise
    
    async def interview_prep(
        self,
        mode: str,
        scholarship_info: Dict[str, Any],
        student_answer: Optional[str] = None,
        question: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Interview preparation - generate questions or evaluate answers
        
        Args:
            mode: "generate_question" or "evaluate_answer"
            scholarship_info: Scholarship information
            student_answer: Student's answer (for evaluation mode)
            question: Interview question (for evaluation mode)
            
        Returns:
            Question or evaluation feedback
        """
        self._ensure_initialized()
        
        try:
            # Load instructions
            instructions = self.yaml_loader.load_instruction("interview_prep")
            
            if mode == "generate_question":
                prompt = f"""{instructions['system_prompt']}

MODE: Generate Question

SCHOLARSHIP INFORMATION:
{json.dumps(scholarship_info, indent=2)}

Generate an interview question as JSON:
"""
            else:  # evaluate_answer
                if not student_answer or not question:
                    raise ValueError("student_answer and question required for evaluation mode")
                
                student_answer = sanitize_input(student_answer, max_length=5000)
                
                prompt = f"""{instructions['system_prompt']}

MODE: Evaluate Answer

QUESTION: {question}

STUDENT ANSWER: {student_answer}

SCHOLARSHIP: {scholarship_info.get('name', 'Unknown')}

Evaluate the answer and provide feedback as JSON:
"""
            
            # Generate response
            response = await self._generate_content(
                prompt=prompt,
                temperature=instructions.get("temperature", 0.5),
                max_tokens=instructions.get("max_tokens", 2048),
            )
            
            # Parse JSON response
            result = self._parse_json_response(response)
            
            logger.info(f"Interview prep ({mode}) completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error in interview prep: {e}", exc_info=True)
            raise
    
    async def _generate_content(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """
        Generate content using Gemini AI
        
        Args:
            prompt: The prompt to send to Gemini
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text response
        """
        try:
            # Configure generation
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
                candidate_count=1,
            )
            
            # Generate content
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config,
            )
            
            # Extract text
            if response.candidates:
                return response.candidates[0].content.parts[0].text
            else:
                raise ValueError("No response generated from Gemini")
                
        except Exception as e:
            logger.error(f"Error generating content: {e}", exc_info=True)
            raise
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Parse JSON from AI response
        
        Args:
            response: Raw response text
            
        Returns:
            Parsed JSON data
        """
        try:
            # Try to find JSON in response
            # Sometimes AI wraps JSON in markdown code blocks
            if "```json" in response:
                start = response.find("```json") + 7
                end = response.find("```", start)
                json_str = response[start:end].strip()
            elif "```" in response:
                start = response.find("```") + 3
                end = response.find("```", start)
                json_str = response[start:end].strip()
            else:
                json_str = response.strip()
            
            # Parse JSON
            return json.loads(json_str)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Response was: {response}")
            raise ValueError(f"Invalid JSON response from AI: {str(e)}")
