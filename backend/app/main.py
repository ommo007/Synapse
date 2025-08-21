from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.core.database import engine, Base
from app.api import auth, projects, commits, ai

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database connected to Supabase successfully!")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title="Synapse API",
    description="AI-powered commit insights for hackathon teams",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
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
