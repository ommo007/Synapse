import os
import json
import asyncio
from typing import Dict, Any, List
from dotenv import load_dotenv

from portia import (
    Config,
    LLMProvider,
    Portia,
    example_tool_registry,
)

load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

google_config = Config.from_default(
    llm_provider=LLMProvider.GOOGLE,
    default_model="google/gemini-2.0-flash-exp",
    google_api_key=GOOGLE_API_KEY
)

portia = Portia(config=google_config, tools=example_tool_registry)

class PortiaAgent:
    async def summarize_commit(
        self,
        message: str,
        diff_snippet: str,
        files: List[str]
    ) -> Dict[str, Any]:
        prompt = f"""
Analyze this Git commit and return ONLY a JSON object with this exact structure:

{{
  "simple_explanation": "Brief explanation in 2-3 sentences",
  "technical_summary": ["Technical point 1", "Technical point 2", "Technical point 3"],
  "how_to_test": {{
    "steps": ["Step 1", "Step 2"],
    "curl": null,
    "postman": null
  }},
  "tags": ["tag1", "tag2", "tag3"],
  "risk_level": "low"
}}

Commit message: {message}
Files: {', '.join(files[:5]) if files else 'none'}
Diff: {diff_snippet[:1000] if diff_snippet else 'none'}

Return ONLY the JSON object, no markdown, no explanation.
"""
        try:
            # Run Portia in executor to avoid blocking
            loop = asyncio.get_event_loop()
            plan_run = await loop.run_in_executor(None, portia.run, prompt)
            
            # Extract output from plan_run
            output = self._extract_output(plan_run)
            
            if not output:
                print("❌ No output from Portia")
                return self._fallback_summary(message)
            
            print(f"🔍 Raw output: {output[:200]}...")
            
            # Clean and parse JSON
            json_data = self._extract_and_parse_json(output)
            
            if json_data:
                # Ensure required fields
                json_data = self._validate_and_fix_data(json_data, message)
                print(f"✅ AI Summary generated: {json_data['simple_explanation'][:50]}...")
                return json_data
            else:
                print("❌ Failed to parse JSON")
                return self._fallback_summary(message)
                
        except Exception as e:
            print(f"❌ Portia error: {e}")
            return self._fallback_summary(message)
    
    def _extract_output(self, plan_run):
        """Extract output from plan_run object"""
        # Try different possible attributes
        for attr in ['final_output', 'output', 'result', 'content']:
            if hasattr(plan_run, attr):
                output = getattr(plan_run, attr)
                if output:
                    return str(output)
        
        # Try to get from messages
        if hasattr(plan_run, 'messages') and plan_run.messages:
            last_message = plan_run.messages[-1]
            if hasattr(last_message, 'content'):
                return str(last_message.content)
            else:
                return str(last_message)
        
        # Last resort - convert whole object to string
        return str(plan_run)
    
    def _extract_and_parse_json(self, output):
        """Extract and parse JSON from output"""
        try:
            # Remove markdown if present
            cleaned = output
            if "```json" in output:
                cleaned = output.split("```json")[1].split("```")[0]
            elif "```" in output:
                cleaned = output.split("```")[1].split("```")[0]
            
            # Try to find JSON object
            cleaned = cleaned.strip()
            
            # Find the first { and last }
            start = cleaned.find('{')
            end = cleaned.rfind('}')
            
            if start != -1 and end != -1 and end > start:
                json_str = cleaned[start:end+1]
                return json.loads(json_str)
            
            # If no braces found, try parsing the whole thing
            return json.loads(cleaned)
            
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Trying to parse: {cleaned[:200]}...")
            return None
        except Exception as e:
            print(f"Extraction error: {e}")
            return None
    
    def _validate_and_fix_data(self, data, message):
        """Ensure all required fields exist with proper types"""
        if not isinstance(data, dict):
            return self._fallback_summary(message)
        
        # Fix simple_explanation
        if "simple_explanation" not in data or not data["simple_explanation"]:
            data["simple_explanation"] = f"This commit: {message[:100]}"
        
        # Fix technical_summary
        if "technical_summary" not in data or not isinstance(data["technical_summary"], list):
            data["technical_summary"] = ["Code changes made", "Updates applied"]
        
        # Fix how_to_test
        if "how_to_test" not in data or not isinstance(data["how_to_test"], dict):
            data["how_to_test"] = {"steps": ["Test the changes"], "curl": None, "postman": None}
        elif "steps" not in data["how_to_test"]:
            data["how_to_test"]["steps"] = ["Test the changes"]
        
        # Fix tags
        if "tags" not in data or not isinstance(data["tags"], list):
            data["tags"] = ["update"]
        
        # Fix risk_level
        if "risk_level" not in data or data["risk_level"] not in ["low", "medium", "high"]:
            data["risk_level"] = "low"
        
        return data
    
    def _fallback_summary(self, message: str) -> Dict[str, Any]:
        """Fallback summary when AI fails"""
        return {
            "simple_explanation": f"This commit: {message[:100]}",
            "technical_summary": ["Code changes were made", "Updates were applied"],
            "how_to_test": {
                "steps": ["Review the changes", "Test the affected functionality"],
                "curl": None,
                "postman": None
            },
            "tags": ["update"],
            "risk_level": "low",
            "plan_run_id": None
        }

    async def answer_question(self, question: str, context_blocks: List[Dict]) -> Dict[str, Any]:
        """Answer questions about commits"""
        try:
            context_str = "\n\n".join([
                f"SHA: {c['sha']}\nMsg:{c['message']}\nSummary:{c.get('summary', 'N/A')}" 
                for c in context_blocks[:5]
            ])
            
            prompt = f"""
Answer this question based on the commit context:

Context:
{context_str[:3000]}

Question: {question}

Provide a clear, helpful answer.
"""
            loop = asyncio.get_event_loop()
            plan_run = await loop.run_in_executor(None, portia.run, prompt)
            output = self._extract_output(plan_run)
            
            return {
                "answer": output or "I'm having trouble processing this question.", 
                "plan_run_id": getattr(plan_run, "id", None)
            }
        except Exception as e:
            print(f"❌ Error in answer_question: {e}")
            return {
                "answer": "I'm having trouble processing this question. Please try again.",
                "plan_run_id": None
            }

portia_agent = PortiaAgent()