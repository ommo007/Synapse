from urllib.parse import urlencode
import os
import httpx

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
# IMPORTANT: set this on Render to your backend, no trailing slash
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")


def _build_redirect_uri() -> str:
    """
    Must exactly match the Authorization callback URL in your GitHub OAuth App.
    Example: https://synapse-93g5.onrender.com/auth/github/callback
    """
    return f"{BACKEND_URL}/auth/github/callback"


def get_authorize_url(state: str) -> str:
    """Generate GitHub OAuth authorization URL (consistent redirect_uri)."""
    if not GITHUB_CLIENT_ID:
        raise ValueError("GITHUB_CLIENT_ID not configured")

    redirect_uri = _build_redirect_uri()

    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri,
        # Only request what you need; repo gives private repo access
        "scope": "read:user user:email repo",
        "state": state,
        "allow_signup": "true",
        "response_type": "code",
    }
    return f"{GITHUB_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> str:
    """Exchange authorization code for access token (redirect_uri must match)."""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise ValueError("GitHub OAuth credentials not configured")

    redirect_uri = _build_redirect_uri()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GITHUB_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        access_token = data.get("access_token")
        if not access_token:
            raise ValueError(f"Failed to get access token: {data}")
        return access_token


async def get_github_user(access_token: str) -> dict:
    """Fetch GitHub user information."""
    headers = {
        # 'token' is the canonical scheme for GitHub OAuth tokens
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Synapse-App",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(GITHUB_USER_URL, headers=headers, timeout=30)
        resp.raise_for_status()
        return resp.json()