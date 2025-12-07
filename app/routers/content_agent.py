from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_current_user
from agent.content_agent import (
    chat_with_agent,
    get_user_conversation_history,
    reset_user_conversation,
    delete_user_thread
)

router = APIRouter(prefix="/api/v1/content-agent", tags=["Content Agent"])


# Schemas
class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    thread_id: str


class ConversationItem(BaseModel):
    user_input: str
    assistant_output: str
    created_at: str


class ConversationHistoryResponse(BaseModel):
    conversations: List[ConversationItem]
    total: int


class DeleteResponse(BaseModel):
    success: bool
    message: str
    deleted_count: Optional[int] = None


# Endpoints
@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with the content agent.
    Agent will generate copywriting and content scripts for your business.
    """
    try:
        # Get user's UMKM data if exists
        umkm = current_user.umkm

        if not umkm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User belum memiliki data UMKM. Silakan lengkapi profil bisnis terlebih dahulu."
            )

        # Call the agent
        response = chat_with_agent(
            user_id=str(current_user.id),
            user_name=current_user.name,
            business_name=umkm.business_name,
            business_type=umkm.business_category,
            message=request.message
        )

        # Get thread_id for response
        from agent.content_agent import get_or_create_thread
        thread_id = get_or_create_thread(str(current_user.id))

        return ChatResponse(
            response=response,
            thread_id=thread_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saat berkomunikasi dengan agent: {str(e)}"
        )


@router.get("/history", response_model=ConversationHistoryResponse)
async def get_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """
    Get conversation history for current user.
    """
    try:
        conversations = get_user_conversation_history(
            user_id=str(current_user.id),
            limit=limit
        )

        return ConversationHistoryResponse(
            conversations=[
                ConversationItem(
                    user_input=conv['user_input'],
                    assistant_output=conv['assistant_output'],
                    created_at=conv['created_at']
                )
                for conv in conversations
            ],
            total=len(conversations)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saat mengambil history: {str(e)}"
        )


@router.delete("/history", response_model=DeleteResponse)
async def reset_history(
    current_user: User = Depends(get_current_user)
):
    """
    Reset/delete conversation history for current user.
    This will clear all chat history but keep the thread_id.
    """
    try:
        deleted_count = reset_user_conversation(str(current_user.id))

        return DeleteResponse(
            success=True,
            message=f"Berhasil menghapus {deleted_count} percakapan",
            deleted_count=deleted_count
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saat menghapus history: {str(e)}"
        )


@router.delete("/thread", response_model=DeleteResponse)
async def delete_thread(
    current_user: User = Depends(get_current_user)
):
    """
    Delete user thread completely.
    This will remove all conversation history and thread mapping.
    User will get a new thread_id on next chat.
    """
    try:
        success = delete_user_thread(str(current_user.id))

        if success:
            return DeleteResponse(
                success=True,
                message="Thread berhasil dihapus. Anda akan mendapat thread baru saat chat berikutnya."
            )
        else:
            return DeleteResponse(
                success=False,
                message="Thread tidak ditemukan"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saat menghapus thread: {str(e)}"
        )
