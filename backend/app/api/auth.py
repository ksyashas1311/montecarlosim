import secrets
import urllib.parse
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user,
)
from app import schemas, models
from app.database import get_db
from app.repositories import user_repository

router = APIRouter(tags=["Authentication"])

@router.post("/auth/register", response_model=schemas.UserSafeProfile, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: schemas.UserRegister,
    response: Response,
    db: Session = Depends(get_db)
):
    # Check if user already exists
    existing_user = user_repository.get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Hash password & create user
    hashed_pwd = get_password_hash(user_in.password)
    user = user_repository.create_auth_user(
        db=db,
        email=user_in.email,
        hashed_password=hashed_pwd,
        name=user_in.name,
    )

    # Issue tokens & set httpOnly cookies
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    set_auth_cookies(response=response, access_token=access_token, refresh_token=refresh_token)

    return user

@router.post("/auth/login", response_model=schemas.UserSafeProfile)
def login_user(
    credentials: schemas.UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    user = user_repository.get_user_by_email(db, email=credentials.email)
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Issue tokens & set cookies
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    set_auth_cookies(response=response, access_token=access_token, refresh_token=refresh_token)

    return user

@router.post("/auth/refresh")
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    payload = decode_token(refresh_token_cookie, expected_type="refresh")
    user_id = int(payload.get("sub"))
    
    user = user_repository.get_user(db, user_id=user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Issue rotated access & refresh tokens
    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)
    set_auth_cookies(response=response, access_token=new_access_token, refresh_token=new_refresh_token)

    return {"detail": "Token refreshed successfully"}

@router.post("/auth/logout")
def logout_user(response: Response):
    clear_auth_cookies(response=response)
    return {"detail": "Logged out successfully"}

@router.get("/auth/me", response_model=schemas.UserSafeProfile)
def get_current_user_profile(
    current_user: models.User = Depends(get_current_user)
):
    return current_user

# --- Google OAuth Endpoints ---

@router.get("/auth/google/login")
def google_oauth_login(response: Response):
    state = secrets.token_urlsafe(32)
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    }
    google_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    
    redirect_res = RedirectResponse(url=google_url, status_code=status.HTTP_302_FOUND)
    # Set state cookie for CSRF verification
    redirect_res.set_cookie(
        key="oauth_state",
        value=state,
        max_age=600,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return redirect_res

@router.get("/auth/google/callback")
async def google_oauth_callback(
    request: Request,
    db: Session = Depends(get_db),
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    if error:
        frontend_redirect = f"{settings.FRONTEND_URL}?auth_error={urllib.parse.quote(error)}"
        return RedirectResponse(url=frontend_redirect, status_code=status.HTTP_302_FOUND)

    stored_state = request.cookies.get("oauth_state")
    if not state or not stored_state or state != stored_state:
        frontend_redirect = f"{settings.FRONTEND_URL}?auth_error=invalid_state"
        res = RedirectResponse(url=frontend_redirect, status_code=status.HTTP_302_FOUND)
        res.delete_cookie("oauth_state", path="/")
        return res

    if not code:
        frontend_redirect = f"{settings.FRONTEND_URL}?auth_error=missing_code"
        res = RedirectResponse(url=frontend_redirect, status_code=status.HTTP_302_FOUND)
        res.delete_cookie("oauth_state", path="/")
        return res

    # Exchange authorization code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_res = await client.post(token_url, data=token_data)
            if token_res.status_code != 200:
                frontend_redirect = f"{settings.FRONTEND_URL}?auth_error=token_exchange_failed"
                res = RedirectResponse(url=frontend_redirect, status_code=status.HTTP_302_FOUND)
                res.delete_cookie("oauth_state", path="/")
                return res

            tokens = token_res.json()
            access_token_google = tokens.get("access_token")

            # Fetch user info from Google
            userinfo_res = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token_google}"}
            )
            if userinfo_res.status_code != 200:
                frontend_redirect = f"{settings.FRONTEND_URL}?auth_error=userinfo_fetch_failed"
                res = RedirectResponse(url=frontend_redirect, status_code=status.HTTP_302_FOUND)
                res.delete_cookie("oauth_state", path="/")
                return res

            user_info = userinfo_res.json()
    except Exception as exc:
        frontend_redirect = f"{settings.FRONTEND_URL}?auth_error={urllib.parse.quote(str(exc))}"
        res = RedirectResponse(url=frontend_redirect, status_code=status.HTTP_302_FOUND)
        res.delete_cookie("oauth_state", path="/")
        return res

    google_id = user_info.get("sub")
    email = user_info.get("email")
    email_verified = user_info.get("email_verified", False)
    name = user_info.get("name")
    avatar_url = user_info.get("picture")

    if not google_id or not email or not email_verified:
        frontend_redirect = f"{settings.FRONTEND_URL}?auth_error=unverified_email"
        res = RedirectResponse(url=frontend_redirect, status_code=status.HTTP_302_FOUND)
        res.delete_cookie("oauth_state", path="/")
        return res


    # 1. Check if user with matching google_id exists
    user = user_repository.get_user_by_google_id(db, google_id=google_id)
    if not user:
        # 2. Check if user with matching email exists -> link account
        user = user_repository.get_user_by_email(db, email=email)
        if user:
            user = user_repository.update_user_google_info(
                db=db,
                user=user,
                google_id=google_id,
                avatar_url=avatar_url,
                name=name
            )
        else:
            # 3. Create new user
            user = user_repository.create_auth_user(
                db=db,
                email=email,
                name=name,
                google_id=google_id,
                avatar_url=avatar_url,
                hashed_password=None
            )

    # Issue JWT tokens and set cookies on redirect
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    redirect_res = RedirectResponse(url=settings.FRONTEND_URL, status_code=status.HTTP_302_FOUND)
    set_auth_cookies(response=redirect_res, access_token=access_token, refresh_token=refresh_token)
    redirect_res.delete_cookie("oauth_state", path="/")
    return redirect_res
