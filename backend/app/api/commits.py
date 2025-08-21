from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Commit, CommitAI
from app.services.portia_agent import portia_agent
from app.services.github_service import github_service
from app.models.models import Project

router = APIRouter()


@router.get("/{sha}")
async def get_commit(
    sha: str,
    db: AsyncSession = Depends(get_db)
):
    # 1. Get commit from DB
    result = await db.execute(select(Commit).where(Commit.sha == sha))
    commit = result.scalar_one_or_none()
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")

    # 2. Get project (to get owner/repo)
    project = await db.execute(select(Project).where(Project.id == commit.project_id))
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 3. Fetch commit details from GitHub
    gh_commit = await github_service.get_commit_details(
        owner=project.github_owner,
        repo=project.github_repo,
        sha=sha
    )

    # 4. Extract files info
    files = []
    if gh_commit and "files" in gh_commit:
        files = [
            {
                "filename": f.get("filename"),
                "status": f.get("status"),
                "additions": f.get("additions"),
                "deletions": f.get("deletions"),
                "patch": (f.get("patch") or "")[:4000],  # optional, for AI
            }
            for f in gh_commit["files"]
        ]

    # 5. AI summary as before
    ai_result = await db.execute(select(CommitAI).where(CommitAI.sha == sha))
    ai_summary = ai_result.scalar_one_or_none()

    commit_dict = {
        "sha": commit.sha,
        "message": commit.message,
        "author_name": commit.author_name,
        "author_login": commit.author_login,
        "committed_at": commit.committed_at.isoformat(),
        "files": files,  # <-- THIS IS WHAT THE FRONTEND NEEDS!
        "url": commit.url,
        "project_id": commit.project_id
    }

    if ai_summary:
        commit_dict["ai_summary"] = {
            "simple_explanation": ai_summary.simple_explanation,
            "technical_summary": ai_summary.technical_summary,
            "how_to_test": ai_summary.how_to_test,
            "tags": ai_summary.tags,
            "risk_level": ai_summary.risk_level.value,
            "plan_run_id": ai_summary.plan_run_id
        }

    return commit_dict

@router.post("/{sha}/summarize")
async def summarize_commit(
    sha: str,
    db: AsyncSession = Depends(get_db)
):
    ai_result = await db.execute(
        select(CommitAI).where(CommitAI.sha == sha)
    )
    existing_summary = ai_result.scalar_one_or_none()
    
    if existing_summary:
        return {
            "simple_explanation": existing_summary.simple_explanation,
            "technical_summary": existing_summary.technical_summary,
            "how_to_test": existing_summary.how_to_test,
            "tags": existing_summary.tags,
            "risk_level": existing_summary.risk_level.value,
            "plan_run_id": existing_summary.plan_run_id
        }
    
    commit_result = await db.execute(
        select(Commit).where(Commit.sha == sha)
    )
    commit = commit_result.scalar_one_or_none()
    
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    try:
        summary = await portia_agent.summarize_commit(
            message=commit.message,
            diff_snippet="",
            files=commit.files_summary or []
        )
        
        ai_summary = CommitAI(
            sha=sha,
            simple_explanation=summary["simple_explanation"],
            technical_summary=summary["technical_summary"],
            how_to_test=summary["how_to_test"],
            tags=summary["tags"],
            risk_level=summary["risk_level"],
            plan_run_id=summary.get("plan_run_id")
        )
        db.add(ai_summary)
        await db.commit()
        
        return summary
        
    except Exception as e:
        print(f"❌ AI summary failed: {e}")
        fallback_summary = {
            "simple_explanation": f"This commit: {commit.message[:100]}",
            "technical_summary": ["Code changes", "Updates"],
            "how_to_test": {"steps": ["Test changes"], "curl": None, "postman": None},
            "tags": ["update"],
            "risk_level": "low"
        }
        
        ai_summary = CommitAI(
            sha=sha,
            simple_explanation=fallback_summary["simple_explanation"],
            technical_summary=fallback_summary["technical_summary"],
            how_to_test=fallback_summary["how_to_test"],
            tags=fallback_summary["tags"],
            risk_level=fallback_summary["risk_level"]
        )
        db.add(ai_summary)
        await db.commit()
        
        return fallback_summary
