from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncio
from dotenv import load_dotenv

from app.core.database import engine, Base
from app.api import auth, projects, commits, ai

load_dotenv()

async def init_database():
    """Initialize database with retry logic"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("✅ Database connected to Supabase successfully!")
            return True
        except Exception as e:
            print(f"❌ Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print("⏳ Retrying in 2 seconds...")
                await asyncio.sleep(2)
            else:
                print("❌ All database connection attempts failed")
                return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_database()
    yield
    # Shutdown
    try:
        await engine.dispose()
    except:
        pass

app = FastAPI(
    title="Synapse API",
    description="AI-powered commit insights for hackathon teams",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://synapse-puce-rho.vercel.app",
        "https://*.vercel.app",  # For preview deployments
        "http://localhost:5173",  # For local development
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
