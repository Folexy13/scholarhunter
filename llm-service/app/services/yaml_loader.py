"""
YAML Instruction Loader
Loads and caches YAML instruction files for Gemini AI
"""

import os
import logging
from typing import Dict, Any
import yaml
from pathlib import Path

logger = logging.getLogger(__name__)


class YAMLInstructionLoader:
    """Loader for YAML instruction files"""
    
    def __init__(self):
        self.instructions_dir = Path(__file__).parent.parent.parent / "instructions"
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def load_instruction(self, instruction_name: str) -> Dict[str, Any]:
        """
        Load YAML instruction file
        
        Args:
            instruction_name: Name of instruction file (without .yaml extension)
            
        Returns:
            Parsed YAML data as dictionary
        """
        # Check cache first
        if instruction_name in self._cache:
            logger.debug(f"Loading instruction '{instruction_name}' from cache")
            return self._cache[instruction_name]
        
        # Load from file
        file_path = self.instructions_dir / f"{instruction_name}.yaml"
        
        if not file_path.exists():
            raise FileNotFoundError(f"Instruction file not found: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            # Cache the loaded data
            self._cache[instruction_name] = data
            
            logger.info(f"Loaded instruction '{instruction_name}' from {file_path}")
            return data
            
        except yaml.YAMLError as e:
            logger.error(f"Error parsing YAML file {file_path}: {e}", exc_info=True)
            raise ValueError(f"Invalid YAML in {instruction_name}.yaml: {str(e)}")
        except Exception as e:
            logger.error(f"Error loading instruction file {file_path}: {e}", exc_info=True)
            raise
    
    def reload_instruction(self, instruction_name: str) -> Dict[str, Any]:
        """
        Reload instruction file (bypass cache)
        
        Args:
            instruction_name: Name of instruction file
            
        Returns:
            Parsed YAML data
        """
        # Clear from cache
        if instruction_name in self._cache:
            del self._cache[instruction_name]
        
        # Load fresh
        return self.load_instruction(instruction_name)
    
    def clear_cache(self):
        """Clear all cached instructions"""
        self._cache.clear()
        logger.info("Instruction cache cleared")
    
    def list_available_instructions(self) -> list[str]:
        """
        List all available instruction files
        
        Returns:
            List of instruction names (without .yaml extension)
        """
        if not self.instructions_dir.exists():
            return []
        
        instructions = []
        for file_path in self.instructions_dir.glob("*.yaml"):
            instructions.append(file_path.stem)
        
        return sorted(instructions)
