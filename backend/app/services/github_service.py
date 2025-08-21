import httpx
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class GitHubService:
    def __init__(self):
        self.client_id = os.getenv("GITHUB_CLIENT_ID")
        self.client_secret = os.getenv("GITHUB_CLIENT_SECRET")
        self.redirect_uri = os.getenv("GITHUB_REDIRECT_URI")
        
    async def get_public_repo_commits(
        self, 
        owner: str, 
        repo: str,
        branch: str = "main",
        per_page: int = 30,
        page: int = 1
    ) -> List[Dict[str, Any]]:
        """Get commits from a PUBLIC repository with pagination"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/commits",
                    headers={"Accept": "application/vnd.github.v3+json"},
                    params={"sha": branch, "per_page": per_page, "page": page}
                )
                
                if response.status_code == 409:
                    response = await client.get(
                        f"https://api.github.com/repos/{owner}/{repo}/commits",
                        headers={"Accept": "application/vnd.github.v3+json"},
                        params={"sha": "master", "per_page": per_page, "page": page}
                    )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"GitHub API error: {response.status_code}")
                    return []
                    
            except Exception as e:
                print(f"Error fetching commits: {e}")
                return []

github_service = GitHubService()
