from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
import os

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
    # Store state in cookie for CSRF protection
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
    
    # Verify state for CSRF protection
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    try:
        # Exchange code for token
        access_token = await exchange_code_for_token(code)
        
        # Get user info from GitHub
        github_user = await get_github_user(access_token)
        
        # In auth.py, replace the user creation/update section (around lines 55-75) with:

        # Check if user exists
        result = await db.execute(
            select(User).where(User.github_id == str(github_user["id"]))
        )
        user = result.scalar_one_or_none()
        
        if not user:
            # Create new user (let database auto-generate the ID)
            user = User(
                # Remove any id field - let database handle it
                github_id=str(github_user["id"]),
                github_login=github_user["login"],
                name=github_user.get("name"),
                email=github_user.get("email"),
                avatar_url=github_user.get("avatar_url"),
                access_token=access_token
            )
            db.add(user)
            await db.flush()  # Add this to ensure the user gets an ID
        else:
            # Update existing user's token and info
            user.access_token = access_token
            user.name = github_user.get("name", user.name)
            user.email = github_user.get("email", user.email)
            user.avatar_url = github_user.get("avatar_url", user.avatar_url)
            user.github_login = github_user["login"]
        
        await db.commit()
        
        # Redirect to frontend with success
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        response = RedirectResponse(
            url=f"{frontend_url}/connect?auth=success&user={user.github_login}",
            status_code=302
        )
        
        # Set auth cookie for subsequent API calls
        response.set_cookie(
            key="github_token",
            value=access_token,
            max_age=30 * 24 * 60 * 60,  # 30 days
            httponly=True,
            samesite="lax",
            secure=False  # Set to True in production with HTTPS
        )
        
        # Clear OAuth state cookie
        response.delete_cookie("oauth_state")
        
        return response
        
    except Exception as e:
        print(f"OAuth error: {e}")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(
            url=f"{frontend_url}/connect?auth=error",
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