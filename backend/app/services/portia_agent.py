import json
import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

class PortiaAgent:
    def __init__(self):
        # Simple fallback agent that works without Portia for now
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        
    async def summarize_commit(
        self,
        message: str,
        diff_snippet: str,
        files: List[str]
    ) -> Dict[str, Any]:
        """Generate AI summary for a commit (fallback version)"""
        
        # Smart responses based on commit message analysis
        message_lower = message.lower()
        
        if "initial" in message_lower or "first" in message_lower or "setup" in message_lower:
            return {
                "simple_explanation": "This is the initial commit that sets up the project foundation. It creates the basic structure and files needed to get started.",
                "technical_summary": [
                    "Created project scaffolding and directory structure",
                    "Added initial configuration files",
                    "Set up basic project dependencies",
                    "Established coding standards and conventions"
                ],
                "how_to_test": {
                    "steps": [
                        "Clone the repository to your local machine",
                        "Check that all initial files are present",
                        "Verify project structure is correct"
                    ],
                    "curl": None,
                    "postman": None
                },
                "tags": ["setup", "initial", "foundation"],
                "risk_level": "low"
            }
        elif any(word in message_lower for word in ["fix", "bug", "error", "issue"]):
            return {
                "simple_explanation": "This commit fixes a bug or issue in the codebase. The changes resolve problems that were affecting functionality.",
                "technical_summary": [
                    "Identified and resolved critical issues",
                    "Improved error handling and validation",
                    "Enhanced application stability",
                    "Fixed edge cases and corner scenarios"
                ],
                "how_to_test": {
                    "steps": [
                        "Reproduce the original issue",
                        "Verify the fix resolves the problem",
                        "Test related functionality",
                        "Run regression tests"
                    ],
                    "curl": None,
                    "postman": None
                },
                "tags": ["bugfix", "stability", "improvement"],
                "risk_level": "low"
            }
        elif any(word in message_lower for word in ["add", "feature", "implement"]):
            return {
                "simple_explanation": "This commit adds new features or functionality to the project. The changes enhance the application's capabilities and user experience.",
                "technical_summary": [
                    "Implemented new features and capabilities",
                    "Enhanced existing functionality",
                    "Improved code organization and structure",
                    "Updated documentation and comments"
                ],
                "how_to_test": {
                    "steps": [
                        "Pull the latest changes",
                        "Test the new functionality",
                        "Verify integration with existing features",
                        "Check for any breaking changes"
                    ],
                    "curl": None,
                    "postman": None
                },
                "tags": ["feature", "enhancement", "development"],
                "risk_level": "medium"
            }
        elif any(word in message_lower for word in ["update", "upgrade", "refactor"]):
            return {
                "simple_explanation": "This commit updates or refactors existing code to improve performance, maintainability, or structure without changing functionality.",
                "technical_summary": [
                    "Refactored code for better maintainability",
                    "Updated dependencies and libraries",
                    "Improved code structure and organization",
                    "Enhanced performance and efficiency"
                ],
                "how_to_test": {
                    "steps": [
                        "Test existing functionality still works",
                        "Check for performance improvements",
                        "Verify no breaking changes",
                        "Run full test suite"
                    ],
                    "curl": None,
                    "postman": None
                },
                "tags": ["refactor", "update", "maintenance"],
                "risk_level": "medium"
            }
        else:
            # Generic response for other commits
            return {
                "simple_explanation": f"This commit makes improvements to the codebase. The changes involve {len(files)} files and focus on enhancing the application's functionality.",
                "technical_summary": [
                    f"Modified {len(files)} files in the codebase",
                    "Implemented code improvements",
                    "Updated existing functionality",
                    "Maintained code quality standards"
                ],
                "how_to_test": {
                    "steps": [
                        "Pull the latest changes from the repository",
                        "Install any new dependencies if needed",
                        "Run the application and test affected features",
                        "Verify everything works as expected"
                    ],
                    "curl": None,
                    "postman": None
                },
                "tags": ["update", "development"],
                "risk_level": "low"
            }

portia_agent = PortiaAgent()
