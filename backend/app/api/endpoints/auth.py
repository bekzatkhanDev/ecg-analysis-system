"""Auth: login (JWT), token (OAuth2 form), register."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token", response_model=Token)
def token(form: OAuth2PasswordRequestForm = Depends(), db: DbSession = ...) -> Token:
    """OAuth2-compatible token (form: username=email, password)."""
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    return Token(access_token=create_access_token(subject=user.id))


@router.post("/login", response_model=Token)
def login(form: UserLogin, db: DbSession = ...) -> Token:
    user = db.query(User).filter(User.email == form.email).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    return Token(access_token=create_access_token(subject=user.id))


@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: DbSession = ...) -> UserResponse:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)
