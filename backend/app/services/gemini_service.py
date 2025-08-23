import os
import asyncio
from typing import List, Dict, Optional
import google.generativeai as genai

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        if self.api_key:
            genai.configure(api_key=self.api_key)
    
    def _summarize_sync(self, message: str, files: List[Dict], max_chars: int = 8000) -> str:
        """Synchronous Gemini summarization"""
        if not self.api_key:
            return f"Summary: {message[:200]}"  # Fallback
        
        model = genai.GenerativeModel(self.model_name)
        
        # Build context from commit data
        context_parts = [f"Commit message: {message}\n"]
        
        for file in files[:20]:  # Limit files to avoid huge prompts
            filename = file.get("filename", "")
            patch = file.get("patch", "")
            if patch:
                # Take first 500 chars of each patch
                context_parts.append(f"\nFile: {filename}\n{patch[:500]}\n")
        
        full_context = "\n".join(context_parts)[:max_chars]
        
        prompt = f"""You are a senior software engineer reviewing this Git commit.
        
Provide a clear, concise summary with:
1. What changed (in plain English)
2. Key technical details
3. Any risks or breaking changes
4. Testing recommendations

{full_context}

Format your response as:
## Summary
(2-3 sentences explaining what this commit does)

## Technical Details
- Bullet point 1
- Bullet point 2
- etc

## Risks
- Any breaking changes or risks (or "None identified")

## Testing
- How to test these changes
"""
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
            return f"Summary: {message[:200]}"
    
    async def summarize_commit(
        self, 
        message: str, 
        files: List[Dict], 
        max_chars: int = 8000
    ) -> str:
        """Async wrapper for commit summarization"""
        return await asyncio.to_thread(
            self._summarize_sync, 
            message, 
            files, 
            max_chars
        )

gemini_service = GeminiService()