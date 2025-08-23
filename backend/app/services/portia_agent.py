import os
import json
import asyncio
from typing import Dict, Any, List
from dotenv import load_dotenv

from portia import (
    Config,
    LLMProvider,
    Portia,
)

load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

# Configure Portia with proper settings
google_config = Config.from_default(
    llm_provider=LLMProvider.GOOGLE,
    default_model="google/gemini-1.5-flash",
    google_api_key=GOOGLE_API_KEY,
)

# Initialize Portia without tools to avoid validation issues
portia = Portia(config=google_config, tools=[])

class PortiaAgent:
    async def summarize_commit(
        self,
        message: str,
        diff_snippet: str,
        files: List[str]
    ) -> Dict[str, Any]:
        
        # Use a structured prompt that Portia can handle better
        prompt = f"""
You are a code analysis assistant. Analyze this Git commit and provide a structured summary.

COMMIT INFORMATION:
Message: {message}
Files Changed: {', '.join(files[:5]) if files else 'No files specified'}
Code Diff Sample: {diff_snippet[:1000] if diff_snippet else 'No diff available'}

TASK: Generate a JSON object with this exact structure:
{{
  "simple_explanation": "A 2-3 sentence explanation of what this commit does in simple terms",
  "technical_summary": ["First technical detail", "Second technical detail", "Third technical detail"],
  "how_to_test": {{
    "steps": ["First test step", "Second test step"],
    "curl": null,
    "postman": null
  }},
  "tags": ["relevant", "commit", "tags"],
  "risk_level": "low"
}}

Return ONLY the JSON object, no additional text or formatting.
"""
        
        try:
            print(f"🧠 Generating AI summary with Portia...")
            
            # Use the standard Portia run method
            response = await self._run_portia_safely(prompt)
            
            if not response:
                print("❌ No response from Portia")
                return self._fallback_summary(message)
            
            # Parse the response
            parsed_data = self._parse_json_response(response)
            
            if parsed_data:
                validated_data = self._validate_response_data(parsed_data, message)
                print(f"✅ AI Summary generated successfully")
                return validated_data
            else:
                print("❌ Failed to parse JSON from response")
                return self._fallback_summary(message)
                
        except Exception as e:
            print(f"❌ Portia error: {str(e)}")
            return self._fallback_summary(message)
    
    async def _run_portia_safely(self, prompt: str) -> str:
        """Run Portia safely with proper error handling"""
        try:
            loop = asyncio.get_event_loop()
            
            def execute_portia():
                try:
                    # Use the standard run method
                    result = portia.run(prompt)
                    
                    # Extract output from the result
                    if result is None:
                        return None
                    
                    # Try to get the final output
                    if hasattr(result, 'final_output'):
                        output = result.final_output
                        # Handle set type (common in Portia responses)
                        if isinstance(output, set):
                            output_list = list(output)
                            return output_list[0] if output_list else None
                        elif isinstance(output, str):
                            return output
                        else:
                            return str(output)
                    
                    # Try other attributes
                    for attr in ['output', 'result', 'content', 'response', 'answer']:
                        if hasattr(result, attr):
                            value = getattr(result, attr)
                            if value:
                                return str(value)
                    
                    # Try to extract from steps if available
                    if hasattr(result, 'steps') and result.steps:
                        last_step = result.steps[-1]
                        if hasattr(last_step, 'output'):
                            return str(last_step.output)
                    
                    # Convert the whole result to string as last resort
                    return str(result)
                    
                except Exception as e:
                    print(f"❌ Portia execution error: {e}")
                    # Try a simpler approach with direct config
                    try:
                        from langchain_google_genai import ChatGoogleGenerativeAI
                        
                        # Use LangChain directly as a fallback
                        llm = ChatGoogleGenerativeAI(
                            model="gemini-1.5-flash",
                            google_api_key=GOOGLE_API_KEY,
                            temperature=0.3
                        )
                        
                        response = llm.invoke(prompt)
                        if hasattr(response, 'content'):
                            return response.content
                        return str(response)
                        
                    except Exception as fallback_e:
                        print(f"❌ Fallback LLM error: {fallback_e}")
                        return None
            
            response = await loop.run_in_executor(None, execute_portia)
            return response
            
        except Exception as e:
            print(f"❌ Run error: {e}")
            return None
    
    def _parse_json_response(self, text):
        """Parse JSON from text response"""
        if not text:
            return None
            
        try:
            # Convert to string and clean
            text_str = str(text).strip()
            
            # Remove markdown code blocks
            if "```json" in text_str:
                start = text_str.find("```json") + 7
                end = text_str.find("```", start)
                if end != -1:
                    text_str = text_str[start:end].strip()
            elif "```" in text_str:
                start = text_str.find("```") + 3
                end = text_str.find("```", start)
                if end != -1:
                    text_str = text_str[start:end].strip()
            
            # Find JSON object
            start_idx = text_str.find('{')
            end_idx = text_str.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = text_str[start_idx:end_idx + 1]
                # Clean up common issues
                json_str = json_str.replace('\n', ' ').replace('\r', '')
                return json.loads(json_str)
            
            # Try parsing the whole string
            return json.loads(text_str)
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            print(f"❌ Attempted to parse: {text_str[:200] if text_str else 'empty'}...")
            return None
        except Exception as e:
            print(f"❌ Parse error: {e}")
            return None
    
    def _validate_response_data(self, data, message):
        """Validate and ensure all required fields exist"""
        if not isinstance(data, dict):
            return self._fallback_summary(message)
        
        result = {}
        
        # Validate each field
        result["simple_explanation"] = str(data.get("simple_explanation", f"This commit: {message[:100]}"))
        
        tech_summary = data.get("technical_summary", [])
        if isinstance(tech_summary, list) and tech_summary:
            result["technical_summary"] = [str(item) for item in tech_summary[:5]]
        else:
            result["technical_summary"] = ["Code changes were made", "Files were updated"]
        
        how_to_test = data.get("how_to_test", {})
        if isinstance(how_to_test, dict):
            result["how_to_test"] = {
                "steps": how_to_test.get("steps", ["Test the changes"]),
                "curl": how_to_test.get("curl"),
                "postman": how_to_test.get("postman")
            }
        else:
            result["how_to_test"] = {
                "steps": ["Review and test the changes"],
                "curl": None,
                "postman": None
            }
        
        tags = data.get("tags", [])
        if isinstance(tags, list) and tags:
            result["tags"] = [str(tag) for tag in tags[:5]]
        else:
            result["tags"] = ["update"]
        
        risk = data.get("risk_level", "low")
        result["risk_level"] = risk if risk in ["low", "medium", "high"] else "low"
        result["plan_run_id"] = None
        
        return result
    
    def _fallback_summary(self, message: str) -> Dict[str, Any]:
        """Fallback summary when AI fails"""
        return {
            "simple_explanation": f"This commit makes changes to the codebase: {message[:100]}{'...' if len(message) > 100 else ''}",
            "technical_summary": [
                "Code modifications were made",
                "Files were updated in the repository",
                "Review the diff for specific changes"
            ],
            "how_to_test": {
                "steps": [
                    "Pull the latest changes",
                    "Review modified files",
                    "Test affected functionality"
                ],
                "curl": None,
                "postman": None
            },
            "tags": ["update", "code-change"],
            "risk_level": "low",
            "plan_run_id": None
        }

    async def answer_question(self, question: str, context_blocks: List[Dict]) -> Dict[str, Any]:
        """Answer questions about commits"""
        
        # Build clear context
        context_lines = []
        for i, block in enumerate(context_blocks[:3], 1):
            context_lines.append(f"Commit {i}:")
            context_lines.append(f"  SHA: {block['sha'][:8]}")
            context_lines.append(f"  Message: {block['message']}")
            context_lines.append(f"  Files: {', '.join(block.get('files', [])[:3])}")
            context_lines.append(f"  Summary: {block.get('summary', 'No summary')}")
            context_lines.append("")
        
        context_str = '\n'.join(context_lines)
        
        prompt = f"""
You are a helpful assistant that explains Git commits to developers.

COMMIT CONTEXT:
{context_str}

USER QUESTION: {question}

Please provide a clear, informative answer based on the commit information above.
Be specific and reference the actual commit details when relevant.

Answer in plain text only.
"""
        
        try:
            print(f"🤖 Answering question with Portia...")
            
            # Get response from Portia
            answer_text = await self._run_portia_safely(prompt)
            
            if not answer_text:
                return {
                    "answer": "I'm having trouble understanding your question. Could you please rephrase it or provide more context?",
                    "plan_run_id": None
                }
            
            # Clean up the answer
            answer_text = str(answer_text).strip()
            
            # Remove any JSON artifacts if present
            if answer_text.startswith('{') and answer_text.endswith('}'):
                try:
                    json_data = json.loads(answer_text)
                    if isinstance(json_data, dict) and 'answer' in json_data:
                        answer_text = json_data['answer']
                except:
                    pass  # Keep original text if not valid JSON
            
            print(f"✅ Portia answered successfully")
            return {
                "answer": answer_text,
                "plan_run_id": None
            }
            
        except Exception as e:
            print(f"❌ Error in answer_question: {e}")
            return {
                "answer": "I'm experiencing technical difficulties. Please try your question again in a moment.",
                "plan_run_id": None
            }

# Create the agent instance
portia_agent = PortiaAgent()