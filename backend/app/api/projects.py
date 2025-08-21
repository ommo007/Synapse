from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Project, User, Commit
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
    offset = (page - 1) * per_page
    
    result = await db.execute(
        select(Commit)
        .where(Commit.project_id == project_id)
        .order_by(Commit.committed_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    commits = result.scalars().all()
    
    commits_data = []
    for commit in commits:
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
        commits_data.append(commit_dict)
    
    print(f"📊 Returning {len(commits_data)} commits for project {project_id}")
    return commits_data
