from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Commit, Project, CommitAI
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
    
    print(f"🤖 Asking AI: {question}")
    
    if not question or not project_id:
        raise HTTPException(status_code=400, detail="Missing question or project_id")

    # Build context: if sha is given, use that commit; else, use last 5 commits
    context_blocks = []
    
    if sha:
        # Get specific commit with full details
        commit_result = await db.execute(select(Commit).where(Commit.sha == sha))
        commit = commit_result.scalar_one_or_none()
        if not commit:
            raise HTTPException(status_code=404, detail="Commit not found")
            
        # Get project details
        project_result = await db.execute(select(Project).where(Project.id == commit.project_id))
        project = project_result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get AI summary if available
        ai_result = await db.execute(select(CommitAI).where(CommitAI.sha == sha))
        ai_summary = ai_result.scalar_one_or_none()
        
        # Get GitHub commit details
        try:
            gh_commit = await github_service.get_commit_details(
                owner=project.github_owner,
                repo=project.github_repo,
                sha=sha
            )
            files = [f.get("filename") for f in (gh_commit.get("files") or [])]
        except Exception as e:
            print(f"⚠️ Failed to fetch GitHub details: {e}")
            files = commit.files_summary or []
        
        context_blocks.append({
            "sha": sha,
            "message": commit.message,
            "summary": ai_summary.simple_explanation if ai_summary else "No AI summary available",
            "files": files,
            "author": commit.author_name,
            "date": commit.committed_at.isoformat()
        })
        
        print(f"📋 Context for commit {sha[:8]}: {len(files)} files, summary: {'Yes' if ai_summary else 'No'}")
        
    else:
        # Fallback: last 5 commits for the project
        commits_result = await db.execute(
            select(Commit).where(Commit.project_id == project_id)
            .order_by(Commit.committed_at.desc()).limit(5)
        )
        commits = commits_result.scalars().all()
        
        for c in commits:
            # Get AI summary for each commit
            ai_result = await db.execute(select(CommitAI).where(CommitAI.sha == c.sha))
            ai_summary = ai_result.scalar_one_or_none()
            
            context_blocks.append({
                "sha": c.sha,
                "message": c.message,
                "summary": ai_summary.simple_explanation if ai_summary else "No AI summary available",
                "files": c.files_summary or [],
                "author": c.author_name,
                "date": c.committed_at.isoformat()
            })
        
        print(f"📋 Context: {len(commits)} recent commits")

    # Call Portia for Q&A
    try:
        answer = await portia_agent.answer_question(
            question=question,
            context_blocks=context_blocks
        )
        print(f"✅ AI answered: {answer['answer'][:100]}...")
        return answer
    except Exception as e:
        print(f"❌ Q&A failed: {e}")
        return {
            "answer": "I'm having trouble processing your question. Please try again or rephrase it.",
            "plan_run_id": None
        }