"""Users: current user info."""
from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)
