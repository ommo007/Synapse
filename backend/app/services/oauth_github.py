import os
import secrets
import httpx
from typing import Optional

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"

def get_authorize_url(state: str) -> str:
    """Generate GitHub OAuth authorization URL"""
    client_id = os.getenv("GITHUB_CLIENT_ID")
    redirect_uri = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/auth/github/callback")
    scope = "repo user:email"
    
    if not client_id:
        raise ValueError("GITHUB_CLIENT_ID not configured")
    
    return (
        f"{GITHUB_AUTH_URL}"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope}"
        f"&state={state}"
    )

async def exchange_code_for_token(code: str) -> str:
    """Exchange authorization code for access token"""
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    redirect_uri = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/auth/github/callback")
    
    if not client_id or not client_secret:
        raise ValueError("GitHub OAuth credentials not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GITHUB_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
            },
        )
        response.raise_for_status()
        data = response.json()
        
        if "access_token" not in data:
            raise ValueError(f"Failed to get access token: {data}")
        
        return data["access_token"]

async def get_github_user(access_token: str) -> dict:
    """Fetch GitHub user information"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GITHUB_USER_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        response.raise_for_status()
        return response.json()