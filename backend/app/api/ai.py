from fastapi import APIRouter

router = APIRouter()

@router.post("/qna")
async def ask_question():
    return {"message": "Q&A endpoint"}
