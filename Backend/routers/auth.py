import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from dbconexion import get_db
from config import settings
from models.user import User
from schemas import GoogleLogin, TokenResponse, UserCreate, UserLogin, UserResponse
from security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)) -> User:
    email = str(user_data.email).lower()
    username = user_data.username.strip().lower()

    existing_user = db.scalar(
        select(User).where(
            or_(
                func.lower(User.email) == email,
                func.lower(User.username) == username.lower(),
            )
        )
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo o nombre de usuario ya esta registrado.",
        )

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo o nombre de usuario ya esta registrado.",
        ) from None

    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    email = str(credentials.email).lower()
    user = db.scalar(select(User).where(func.lower(User.email) == email))

    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(access_token=create_access_token(user.id), email=user.email)


@router.post("/google", response_model=TokenResponse)
def google_login(credentials: GoogleLogin, db: Session = Depends(get_db)) -> TokenResponse:
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La autenticación con Google no está configurada.",
        )

    try:
        google_user = id_token.verify_oauth2_token(
            credentials.credential,
            Request(),
            audience=settings.google_client_id,
        )
    except (ValueError, GoogleAuthError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La credencial de Google no es válida.",
        ) from None

    email = str(google_user.get("email", "")).lower()
    if not email or not google_user.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La cuenta de Google no tiene un correo verificado.",
        )

    user = db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None:
        base_username = "".join(
            character for character in email.split("@")[0]
            if character.isalnum() or character in "_.-"
        )[:42] or "usuario"
        username = base_username
        suffix = 1
        while db.scalar(select(User.id).where(func.lower(User.username) == username.lower())) is not None:
            username = f"{base_username[:45]}{suffix}"
            suffix += 1
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            user = db.scalar(select(User).where(func.lower(User.email) == email))
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No se pudo crear la cuenta.",
                ) from None
        else:
            db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id), email=user.email)
