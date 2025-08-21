from fastapi import APIRouter

router = APIRouter()

@router.get("/github/login")
async def github_login():
    return {"message": "GitHub login endpoint"}

@router.get("/github/callback")
async def github_callback():
    return {"message": "GitHub callback endpoint"}
