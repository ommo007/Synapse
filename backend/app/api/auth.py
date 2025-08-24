from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
import os
import httpx

from app.core.database import get_db
from app.models.models import User
from app.services.oauth_github import (
    get_authorize_url, 
    exchange_code_for_token, 
    get_github_user
)

router = APIRouter()

@router.get("/github/login")
async def github_login(request: Request):
    """Initiate GitHub OAuth flow"""
    state = secrets.token_urlsafe(32)
    auth_url = get_authorize_url(state)
    
    response = RedirectResponse(url=auth_url, status_code=302)
    response.set_cookie(
        key="oauth_state",
        value=state,
        max_age=600,  # 10 minutes
        httponly=True,
        samesite="lax"
    )
    return response

@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: str = None,
    state: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Handle GitHub OAuth callback"""
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    try:
        access_token = await exchange_code_for_token(code)
        github_user = await get_github_user(access_token)
        
        result = await db.execute(
            select(User).where(User.github_id == str(github_user["id"]))
        )
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                github_id=str(github_user["id"]),
                github_login=github_user["login"],
                name=github_user.get("name"),
                email=github_user.get("email"),
                avatar_url=github_user.get("avatar_url"),
                access_token=access_token
            )
            db.add(user)
            await db.flush()
        else:
            user.access_token = access_token
            user.name = github_user.get("name", user.name)
            user.email = github_user.get("email", user.email)
            user.avatar_url = github_user.get("avatar_url", user.avatar_url)
            user.github_login = github_user["login"]
        
        await db.commit()
        
        FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
        response = RedirectResponse(
            url=f"{FRONTEND_URL}/connect?auth=success&user={user.github_login}",
            status_code=302
        )
        
        response.set_cookie(
            key="github_token",
            value=access_token,
            max_age=30 * 24 * 60 * 60,  # 30 days
            httponly=True,
            samesite="lax",
            secure=False
        )
        
        response.delete_cookie("oauth_state")
        return response
        
    except Exception as e:
        print(f"OAuth error: {e}")
        FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/connect?auth=error",
            status_code=302
        )

@router.get("/me")
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get current authenticated user"""
    token = request.cookies.get("github_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(User).where(User.access_token == token)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {
        "id": user.id,
        "github_login": user.github_login,
        "name": user.name,
        "avatar_url": user.avatar_url
    }

@router.get("/repositories")
async def get_user_repositories(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get current user's GitHub repositories"""
    token = request.cookies.get("github_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        async with httpx.AsyncClient() as client:
            # Get ALL repositories (public and private)
            response = await client.get(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Synapse-App"
                },
                params={
                    "sort": "updated",
                    "per_page": 100
                    # Removed visibility filter to get all repos
                }
            )
            
            print(f"GitHub API response status: {response.status_code}")
            
            if response.status_code == 200:
                repos = response.json()
                print(f"Found {len(repos)} total repositories")
                
                # Format all repositories (both public and private)
                formatted_repos = []
                for repo in repos:
                    formatted_repos.append({
                        "id": repo["id"],
                        "name": repo["name"],
                        "full_name": repo["full_name"],
                        "description": repo.get("description"),
                        "language": repo.get("language"),
                        "stargazers_count": repo.get("stargazers_count", 0),
                        "updated_at": repo["updated_at"],
                        "html_url": repo["html_url"],
                        "private": repo.get("private", False),  # Include private flag
                        "owner": {
                            "login": repo["owner"]["login"],
                            "avatar_url": repo["owner"]["avatar_url"]
                        }
                    })
                
                public_count = len([r for r in formatted_repos if not r["private"]])
                private_count = len([r for r in formatted_repos if r["private"]])
                print(f"Returning {len(formatted_repos)} repositories ({public_count} public, {private_count} private)")
                
                return formatted_repos
                
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="GitHub token expired")
            else:
                print(f"GitHub API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=400, detail="Failed to fetch repositories")
                
    except httpx.RequestError as e:
        print(f"Request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to GitHub")
    except Exception as e:
        print(f"Repository fetch error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")