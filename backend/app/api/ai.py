from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Commit, Project
from app.services.portia_agent import portia_agent
from app.services.github_service import github_service

router = APIRouter()

@router.post("/qna")
async def ask_question(
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db)
):
    question = body.get("question")
    sha = body.get("sha")
    project_id = body.get("project_id")
    if not question or not project_id:
        raise HTTPException(status_code=400, detail="Missing question or project_id")

    # Build context: if sha is given, use that commit; else, use last 5 commits
    context_blocks = []
    if sha:
        commit_result = await db.execute(select(Commit).where(Commit.sha == sha))
        commit = commit_result.scalar_one_or_none()
        if not commit:
            raise HTTPException(status_code=404, detail="Commit not found")
        project_result = await db.execute(select(Project).where(Project.id == commit.project_id))
        project = project_result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        gh_commit = await github_service.get_commit_details(
            owner=project.github_owner,
            repo=project.github_repo,
            sha=sha
        )
        context_blocks.append({
            "sha": sha,
            "message": commit.message,
            "summary": None,
            "files": [f.get("filename") for f in (gh_commit.get("files") or [])]
        })
    else:
        # fallback: last 5 commits for the project
        commits_result = await db.execute(
            select(Commit).where(Commit.project_id == project_id).order_by(Commit.committed_at.desc()).limit(5)
        )
        commits = commits_result.scalars().all()
        for c in commits:
            context_blocks.append({
                "sha": c.sha,
                "message": c.message,
                "summary": None,
                "files": c.files_summary or []
            })

    # Call Portia for Q&A
    answer = await portia_agent.answer_question(
        question=question,
        context_blocks=context_blocks
    )
    return answer