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
    get_github_user,
)

router = APIRouter()


@router.get("/github/login")
async def github_login(request: Request):
    """Initiate GitHub OAuth flow."""
    state = secrets.token_urlsafe(32)
    auth_url = get_authorize_url(state)

    response = RedirectResponse(url=auth_url, status_code=302)
    # CSRF state cookie
    response.set_cookie(
        key="oauth_state",
        value=state,
        max_age=600,  # 10 minutes
        httponly=True,
        samesite="lax",
        path="/",
    )
    return response


@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle GitHub OAuth callback and set auth cookie."""
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

    try:
        # Exchange code -> token
        access_token = await exchange_code_for_token(code)
        # Fetch user
        github_user = await get_github_user(access_token)

        # Upsert user
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
                access_token=access_token,
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

        # Redirect to frontend
        redirect_to = f"{FRONTEND_URL}/connect?auth=success&user={user.github_login}"
        response = RedirectResponse(url=redirect_to, status_code=302)

        # Cross-site cookie for Vercel -> Render
        response.set_cookie(
            key="github_token",
            value=access_token,
            max_age=30 * 24 * 60 * 60,  # 30 days
            httponly=True,
            samesite="none",            # cross-site
            secure=True,                # https only
            path="/",
        )

        # Cleanup state cookie
        response.delete_cookie("oauth_state", path="/")

        return response

    except Exception as e:
        print(f"OAuth error: {e}")
        error_redirect = f"{FRONTEND_URL}/connect?auth=error"
        return RedirectResponse(url=error_redirect, status_code=302)


@router.get("/me")
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current authenticated user based on cookie token."""
    token = request.cookies.get("github_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = await db.execute(select(User).where(User.access_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {
        "id": user.id,
        "github_login": user.github_login,
        "name": user.name,
        "avatar_url": user.avatar_url,
    }


@router.get("/repositories")
async def get_user_repositories(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current user's GitHub repositories (requires cookie)."""
    token = request.cookies.get("github_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Synapse-App",
                },
                params={
                    "sort": "updated",
                    "per_page": 100,
                },
                timeout=30,
            )
            if resp.status_code == 200:
                repos = resp.json()
                # Format minimal
                return [
                    {
                        "id": r["id"],
                        "name": r["name"],
                        "full_name": r["full_name"],
                        "description": r.get("description"),
                        "language": r.get("language"),
                        "stargazers_count": r.get("stargazers_count", 0),
                        "updated_at": r["updated_at"],
                        "html_url": r["html_url"],
                        "private": r.get("private", False),
                        "owner": {
                            "login": r["owner"]["login"],
                            "avatar_url": r["owner"]["avatar_url"],
                        },
                    }
                    for r in repos
                ]

            if resp.status_code == 401:
                raise HTTPException(status_code=401, detail="GitHub token expired")

            print(f"GitHub API error: {resp.status_code} - {resp.text}")
            raise HTTPException(status_code=400, detail="Failed to fetch repositories")

    except httpx.RequestError as e:
        print(f"Request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to GitHub")
    except Exception as e:
        print(f"Repository fetch error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")