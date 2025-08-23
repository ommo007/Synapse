from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import Project, User, Commit, CommitAI
from app.services.github_service import github_service
from datetime import datetime
from pydantic import BaseModel

class ProjectCreate(BaseModel):
    name: str
    github_owner: str
    github_repo: str

router = APIRouter()

@router.post("/")
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    user_result = await db.execute(select(User).where(User.id == 1))
    user = user_result.scalar_one_or_none()
    
    if not user:
        user = User(
            id=1,
            github_id="dummy",
            github_login="testuser",
            name="Test User",
            access_token="dummy_token"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    result = await db.execute(
        select(Project).where(
            Project.github_owner == project.github_owner,
            Project.github_repo == project.github_repo
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        commits_result = await db.execute(
            select(Commit).where(Commit.project_id == existing.id).limit(1)
        )
        has_commits = commits_result.scalar_one_or_none()
        
        if has_commits:
            print(f"📋 Project {existing.id} already has commits")
            return existing
        else:
            print(f"📋 Project {existing.id} exists but no commits, fetching...")
            db_project = existing
    else:
        db_project = Project(
            name=project.name,
            github_owner=project.github_owner,
            github_repo=project.github_repo,
            connected_by_user_id=user.id
        )
        db.add(db_project)
        await db.commit()
        await db.refresh(db_project)
        print(f"📋 Created new project {db_project.id}")
    
    print(f"🔍 Fetching commits for {project.github_owner}/{project.github_repo}")
    
    all_commits = []
    for page in range(1, 6):
        try:
            github_commits = await github_service.get_public_repo_commits(
                project.github_owner,
                project.github_repo,
                per_page=30,
                page=page
            )
            
            if not github_commits:
                break
                
            all_commits.extend(github_commits)
            print(f"📄 Page {page}: {len(github_commits)} commits")
            
            if len(all_commits) >= 100:
                break
                
        except Exception as e:
            print(f"❌ Error fetching page {page}: {e}")
            break
    
    print(f"✅ Fetched {len(all_commits)} commits from GitHub")
    
    stored_count = 0
    for commit_data in all_commits:
        try:
            existing_commit = await db.execute(
                select(Commit).where(Commit.sha == commit_data["sha"])
            )
            if existing_commit.scalar_one_or_none():
                continue
                
            commit = Commit(
                sha=commit_data["sha"],
                project_id=db_project.id,
                message=commit_data["commit"]["message"],
                author_name=commit_data["commit"]["author"]["name"],
                author_login=commit_data["author"]["login"] if commit_data.get("author") else None,
                committed_at=datetime.fromisoformat(commit_data["commit"]["author"]["date"].replace("Z", "+00:00")),
                files_summary=[],
                url=commit_data["html_url"]
            )
            db.add(commit)
            stored_count += 1
            
        except Exception as e:
            print(f"❌ Error storing commit: {e}")
            continue
    
    try:
        await db.commit()
        print(f"💾 Stored {stored_count} commits in Supabase")
    except Exception as e:
        print(f"❌ Database commit failed: {e}")
        await db.rollback()
    
    return db_project

@router.get("/{project_id}")
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project

@router.get("/{project_id}/commits")
async def get_project_commits(
    project_id: int,
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get commits for a project with their AI summaries"""
    offset = (page - 1) * per_page
    
    print(f"📊 Fetching commits for project {project_id}, page {page}")
    
    try:
        # Get commits with a more explicit query
        commits_query = (
            select(Commit)
            .where(Commit.project_id == project_id)
            .order_by(Commit.committed_at.desc())
            .offset(offset)
            .limit(per_page)
        )
        
        result = await db.execute(commits_query)
        commits = result.scalars().all()
        
        print(f"📋 Found {len(commits)} commits in database")
        
        commits_data = []
        for commit in commits:
            print(f"🔍 Processing commit {commit.sha[:8]}...")
            
            # Get AI summary with explicit query
            ai_query = select(CommitAI).where(CommitAI.sha == commit.sha)
            ai_result = await db.execute(ai_query)
            ai_summary = ai_result.scalar_one_or_none()
            
            commit_dict = {
                "sha": commit.sha,
                "message": commit.message,
                "author_name": commit.author_name,
                "author_login": commit.author_login,
                "committed_at": commit.committed_at.isoformat(),
                "files_summary": commit.files_summary or [],
                "url": commit.url,
                "project_id": commit.project_id,
                "ai_summary": None
            }
            
            # Add AI summary if it exists
            if ai_summary:
                try:
                    commit_dict["ai_summary"] = {
                        "simple_explanation": ai_summary.simple_explanation,
                        "technical_summary": ai_summary.technical_summary,
                        "how_to_test": ai_summary.how_to_test,
                        "tags": ai_summary.tags,
                        "risk_level": ai_summary.risk_level.value if ai_summary.risk_level else "low",
                        "plan_run_id": ai_summary.plan_run_id
                    }
                    print(f"✅ Added AI summary for commit {commit.sha[:8]}")
                except Exception as e:
                    print(f"❌ Error formatting AI summary for {commit.sha[:8]}: {e}")
                    commit_dict["ai_summary"] = None
            else:
                print(f"📝 No AI summary found for commit {commit.sha[:8]}")
            
            commits_data.append(commit_dict)
        
        # Final debug info
        commits_with_ai = [c for c in commits_data if c["ai_summary"]]
        print(f"📊 Returning {len(commits_data)} commits, {len(commits_with_ai)} with AI summaries")
        
        if commits_with_ai:
            print(f"🧠 First AI summary example: {commits_with_ai[0]['ai_summary']['simple_explanation'][:100]}...")
        
        return commits_data
        
    except Exception as e:
        print(f"❌ Error in get_project_commits: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch commits: {str(e)}")