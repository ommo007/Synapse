from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api import auth, projects, commits, ai

app = FastAPI(title="Synapse API", version="1.0.0")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

# CORS for cookie auth (must NOT use ["*"] with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],                 # e.g. https://synapse-puce-rho.vercel.app
    allow_origin_regex=r"https://.*\.vercel\.app$",  # allow Vercel preview deployments
    allow_credentials=True,                       # send cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(commits.router, prefix="/commits", tags=["commits"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])


@app.get("/")
async def root():
    return {"message": "Synapse API running with Supabase!", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "database": "Supabase"}