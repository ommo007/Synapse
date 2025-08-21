import os
import json
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

# Use the new config method!
google_config = Config.from_default(
    llm_provider=LLMProvider.GOOGLE,
    default_model="google/gemini-2.0-flash",  # or "google/gemini-1.5-flash" if you want
    google_api_key=GOOGLE_API_KEY
)

# Instantiate Portia with config and tools
portia = Portia(config=google_config, tools=example_tool_registry)

class PortiaAgent:
    async def summarize_commit(
        self,
        message: str,
        diff_snippet: str,
        files: List[str]
    ) -> Dict[str, Any]:
        prompt = f"""
You are CommitLens, an AI that explains Git commits to mixed-skill hackathon teams.

Given:
- Commit message: {message}
- Files touched: {files}
- Diff snippet (may be truncated):
{diff_snippet}

Return strict JSON with keys:
{{
  "simple_explanation": "2-4 sentences, no jargon",
  "technical_summary": ["bullet", "points", "about", "implementation"],
  "how_to_test": {{
    "steps": ["step 1...", "step 2..."],
    "curl": "",
    "postman": {{"method": "", "url": "", "headers": {{}}, "body": {{}} }}
  }},
  "tags": ["auth","api","frontend"],
  "risk_level": "low|medium|high"
}}
Return ONLY valid JSON.
"""
        plan_run = await portia.run_async(prompt)
        try:
            data = json.loads(plan_run.final_output)
        except Exception:
            raise Exception("Portia did not return valid JSON")
        data["plan_run_id"] = getattr(plan_run, "id", None)
        return data

    async def answer_question(
        self,
        question: str,
        context_blocks: List[Dict]
    ) -> Dict[str, Any]:
        context_str = "\n\n".join(
            [f"SHA: {c['sha']}\nMsg:{c['message']}\nSummary:{c.get('summary')}\nFiles:{c.get('files')}" for c in context_blocks]
        )
        prompt = f"""
You are CommitLens AI. Use only the provided commit context to answer.

Context:
{context_str}

Question: {question}

Answer clearly. If unsure, say what’s missing and suggest whom to ask.
"""
        plan_run = await portia.run_async(prompt)
        return {"answer": plan_run.final_output, "plan_run_id": getattr(plan_run, "id", None)}

portia_agent = PortiaAgent()