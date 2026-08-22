from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from app import models
from app.repositories import user_repository
from app.database import get_db

api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

def get_current_user(
    api_key: str = Depends(api_key_header),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Dummy authentication. In a real application, this would verify a JWT or OAuth2 token.
    For this demo, we assume the API Key is a Bearer token where the payload is simply the user_id (e.g. 'Bearer 1').
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    try:
        # Very naive mock: 'Bearer 1' -> user_id = 1
        token = api_key.replace("Bearer ", "")
        user_id = int(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
        
    user = user_repository.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user

def verify_user_ownership(
    user_id: int,
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Verifies that the authenticated user is accessing their own resource.
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )
    return current_user
