"""
Gemini AI Service
Handles all interactions with Google Gemini 3.0 API
"""

import logging
import json
from typing import Dict, Any, Optional, List
import google.generativeai as genai

from app.core.config import settings
from app.services.yaml_loader import YAMLInstructionLoader
from app.core.security import sanitize_input

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini AI"""
    
    # Fallback models in order of preference (Gemini 3 and 2.5 models)
    FALLBACK_MODELS = [
        "gemini-3-flash-preview",
        "gemini-3-pro-preview",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
    ]
    
    def __init__(self):
        self.model = None
        self.current_model_name = None
        self.yaml_loader = YAMLInstructionLoader()
        self._initialized = False
    
    async def initialize(self):
        """Initialize Gemini AI with API key"""
        try:
            # Configure Gemini API
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Initialize model
            self.current_model_name = settings.GEMINI_MODEL
            self.model = genai.GenerativeModel(self.current_model_name)
            
            self._initialized = True
            logger.info(f"Gemini AI initialized successfully with model: {self.current_model_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI: {e}", exc_info=True)
            raise
    
    def _switch_to_fallback_model(self, failed_model: str) -> bool:
        """
        Switch to a fallback model when the current one fails.
        Returns True if successfully switched, False if no more fallbacks available.
        """
        try:
            # Find the next available model
            current_index = -1
            if failed_model in self.FALLBACK_MODELS:
                current_index = self.FALLBACK_MODELS.index(failed_model)
            
            # Try the next model in the list
            for i in range(current_index + 1, len(self.FALLBACK_MODELS)):
                next_model = self.FALLBACK_MODELS[i]
                try:
                    self.model = genai.GenerativeModel(next_model)
                    self.current_model_name = next_model
                    logger.warning(f"Switched to fallback model: {next_model}")
                    return True
                except Exception as e:
                    logger.warning(f"Failed to initialize fallback model {next_model}: {e}")
                    continue
            
            return False
        except Exception as e:
            logger.error(f"Error switching to fallback model: {e}")
            return False
    
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
        conversation_history: Optional[list[Dict[str, str]]] = None,
        attachments: Optional[list[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Chat with AI assistant
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            attachments: Optional list of base64 encoded files with mime_type
            
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
                for msg in conversation_history[-10:]:  # More context
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_text += f"{role.upper()}: {content}\n\n"
            
            # Build prompt parts
            prompt_parts = []
            
            # System prompt and history
            prompt_parts.append(f"{instructions['system_prompt']}\n\nCONVERSATION HISTORY:\n{history_text}\n\nSTUDENT: {message}\n\nProvide a helpful response as JSON:")

            # Add attachments if any
            if attachments:
                import base64
                for att in attachments:
                    try:
                        data = base64.b64decode(att["base64"])
                        prompt_parts.append({
                            "mime_type": att["mime_type"],
                            "data": data
                        })
                    except Exception as e:
                        logger.error(f"Error decoding attachment: {e}")
            
            # Generate response
            response = await self._generate_content(
                prompt=prompt_parts,
                temperature=instructions.get("temperature", 0.6),
                max_tokens=instructions.get("max_tokens", 4096),
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
        conversation_history: Optional[list[Dict[str, str]]] = None,
        attachments: Optional[list[Dict[str, Any]]] = None
    ):
        """
        Stream chat response from AI assistant
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            attachments: Optional list of base64 encoded files with mime_type
            
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
                for msg in conversation_history[-10:]:  # More context
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_text += f"{role.upper()}: {content}\n\n"
            
            # Build prompt parts
            prompt_parts = []
            
            # System prompt and history
            prompt_parts.append(f"{instructions['system_prompt']}\n\nCONVERSATION HISTORY:\n{history_text}\n\nSTUDENT: {message}\n\nProvide a helpful response as JSON:")

            # Add attachments if any
            if attachments:
                import base64
                for att in attachments:
                    try:
                        data = base64.b64decode(att["base64"])
                        prompt_parts.append({
                            "mime_type": att["mime_type"],
                            "data": data
                        })
                    except Exception as e:
                        logger.error(f"Error decoding attachment: {e}")
            
            # Configure generation
            generation_config = genai.types.GenerationConfig(
                temperature=instructions.get("temperature", 0.6),
                max_output_tokens=instructions.get("max_tokens", 4096),
                candidate_count=1,
            )
            
            # Generate streaming response
            response = self.model.generate_content(
                prompt_parts,
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
    
    async def discover_faculty(
        self,
        mode: str,
        continent: Optional[str] = None,
        university: Optional[str] = None,
        department: Optional[str] = None,
        student_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Identify universities, departments, and faculty based on region
        """
        self._ensure_initialized()
        
        try:
            # Load instructions
            instructions = self.yaml_loader.load_instruction("faculty_discovery")
            
            # Build prompt
            prompt = instructions['system_prompt'].format(
                mode=mode,
                continent=continent or "Not Specified",
                university=university or "Not Specified",
                department=department or "Not Specified"
            )
            
            if student_profile:
                prompt += f"\n\nSTUDENT PROFILE:\n{json.dumps(student_profile, indent=2)}"
            
            # Generate response
            response = await self._generate_content(
                prompt=prompt,
                temperature=instructions.get("temperature", 0.3),
                max_tokens=instructions.get("max_tokens", 2048),
            )
            
            # Parse JSON response
            result = self._parse_json_response(response)
            return result
            
        except Exception as e:
            logger.error(f"Error in faculty discovery: {e}", exc_info=True)
            raise

    async def generate_document_stream(
        self,
        document_type: str,
        student_profile: Dict[str, Any],
        scholarship_info: Dict[str, Any],
        additional_context: Optional[Dict[str, Any]] = None
    ):
        """
        Stream scholarship application document generation
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
            
            # Configure generation
            generation_config = genai.types.GenerationConfig(
                temperature=instructions.get("temperature", 0.7),
                max_output_tokens=instructions.get("max_tokens", 4096),
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
            
            logger.info(f"Streaming {document_type} generation completed")
            
        except Exception as e:
            logger.error(f"Error in streaming document generation: {e}", exc_info=True)
            raise

    async def conduct_interview(
        self,
        mode: str,
        persona: str,
        interview_type: str,
        user_answer: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        student_profile: Optional[Dict[str, Any]] = None,
        selected_panelists: Optional[List[Dict[str, str]]] = None,
        is_conclusion: bool = False
    ) -> Dict[str, Any]:
        """
        Conduct an interactive interview session with a panel of interviewers
        """
        self._ensure_initialized()
        
        try:
            # Load instructions
            instructions = self.yaml_loader.load_instruction("interview_persona")
            
            # Build prompt
            prompt = instructions['system_prompt'].format(
                mode=mode,
                persona=persona,
                interview_type=interview_type
            )
            
            # Add selected panelists information
            if selected_panelists:
                prompt += "\n\nSELECTED PANELISTS FOR THIS INTERVIEW (ONLY use these panelists):\n"
                for panelist in selected_panelists:
                    prompt += f"- {panelist.get('id')}: {panelist.get('name')} ({panelist.get('role')}) - {panelist.get('title', '')}\n"
                prompt += "\nIMPORTANT: Only introduce and use the panelists listed above. Do NOT mention or introduce any other panelists."
            
            if student_profile:
                prompt += f"\n\nSTUDENT PROFILE:\n{json.dumps(student_profile, indent=2)}"
            
            if history:
                prompt += "\n\nCONVERSATION HISTORY:\n"
                for h in history:
                    prompt += f"{h.get('role', 'user').upper()}: {h.get('content', '')}\n"
            
            if user_answer:
                prompt += f"\n\nSTUDENT'S LATEST ANSWER: {user_answer}"
            
            # Add conclusion instructions if this is a 5-minute warning
            if is_conclusion:
                prompt += """

IMPORTANT - TIME WARNING: The interview time is almost up (5 minutes remaining).
You MUST now conclude the interview. Your response should:
1. Acknowledge that time is running low
2. Summarize the key points discussed during the interview
3. Provide constructive feedback and advice to the candidate based on their responses
4. Thank the candidate for their time
5. Wrap up the session professionally

This is the final response - make it meaningful and helpful for the candidate."""
            
            prompt += "\n\nResponse (JSON):"
            
            # Generate response
            response = await self._generate_content(
                prompt=prompt,
                temperature=instructions.get("temperature", 0.7),
                max_tokens=instructions.get("max_tokens", 2048),
            )
            
            # Parse JSON response
            result = self._parse_json_response(response)
            return result
            
        except Exception as e:
            logger.error(f"Error in interview persona: {e}", exc_info=True)
            raise

    async def _generate_content(
        self,
        prompt: Any,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """
        Generate content using Gemini AI with automatic model fallback and rate limit handling
        
        Args:
            prompt: The prompt to send to Gemini (string or list of parts)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text response
        """
        import asyncio
        
        max_retries = len(self.FALLBACK_MODELS) + 3  # Extra retries for rate limiting
        rate_limit_retries = 0
        max_rate_limit_retries = 5
        last_error = None
        
        for attempt in range(max_retries):
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
                last_error = e
                error_str = str(e).lower()
                
                # Check if this is a rate limit error (429)
                if "429" in error_str or "rate" in error_str or "quota" in error_str or "resource_exhausted" in error_str:
                    rate_limit_retries += 1
                    if rate_limit_retries <= max_rate_limit_retries:
                        # Exponential backoff: 2^retry * 1 second (2s, 4s, 8s, 16s, 32s)
                        wait_time = min(2 ** rate_limit_retries, 60)  # Cap at 60 seconds
                        logger.warning(f"Rate limit hit (attempt {rate_limit_retries}/{max_rate_limit_retries}). Waiting {wait_time}s before retry...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error(f"Rate limit exceeded after {max_rate_limit_retries} retries")
                        raise ValueError(f"Rate limit exceeded. Please try again later. Original error: {e}")
                
                # Check if this is a timeout or model availability error
                elif "deadline" in error_str or "timeout" in error_str or "504" in error_str or "unavailable" in error_str:
                    logger.warning(f"Model {self.current_model_name} failed with timeout/availability error: {e}")
                    
                    # Try to switch to a fallback model
                    if self._switch_to_fallback_model(self.current_model_name):
                        logger.info(f"Retrying with fallback model: {self.current_model_name}")
                        continue
                    else:
                        logger.error("No more fallback models available")
                        break
                else:
                    # For other errors, don't retry with fallback
                    logger.error(f"Error generating content: {e}", exc_info=True)
                    raise
        
        # If we get here, all retries failed
        logger.error(f"All model attempts failed. Last error: {last_error}")
        raise last_error if last_error else ValueError("Failed to generate content")
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Parse JSON from AI response with robust repair
        """
        import json_repair
        
        # Clean common artifacts
        json_str = response.strip()
        
        try:
            # json_repair handles missing commas, trailing commas, 
            # unquoted keys, and markdown blocks automatically.
            return json_repair.loads(json_str)
        except Exception as e:
            logger.error(f"Failed to repair and parse JSON: {e}")
            logger.debug(f"Raw string: {response}")
            raise ValueError(f"Invalid JSON response from AI even after repair: {str(e)}")
