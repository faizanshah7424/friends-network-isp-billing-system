from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db, get_current_active_user
from backend.app.core.security import verify_password, create_access_token
from backend.app.repositories.user import user_repository
from backend.app.repositories.log import activity_log_repository
from backend.app.schemas.token import Token
from backend.app.schemas.user import UserSchema
from backend.app.models.user import User

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = user_repository.get_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
    
    access_token = create_access_token(subject=user.id)
    
    # Audit log
    activity_log_repository.log_action(
        db,
        user_id=user.id,
        username=user.username,
        action="Login",
        details=f"User {user.username} logged in successfully.",
        request=request
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

from backend.app.api.deps import PermissionChecker
from backend.app.core.security import get_password_hash
from backend.app.schemas.user import UserCreate, UserUpdate
from backend.app.models.role import Role
from typing import List

@router.get("/users", response_model=List[UserSchema])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    return db.query(User).all()

@router.post("/users", response_model=UserSchema)
def create_operator_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    existing = user_repository.get_by_username(db, username=user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    role = db.query(Role).filter(Role.id == user_in.role_id).first()
    if not role:
        role = db.query(Role).filter(Role.name == user_in.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role ID selected")

    user_db = User(
        username=user_in.username,
        full_name=user_in.full_name,
        password_hash=get_password_hash(user_in.password),
        role_id=role.id,
        is_active=True
    )
    db.add(user_db)
    db.commit()
    db.refresh(user_db)
    return user_db

@router.post("/users/{id}/deactivate", response_model=UserSchema)
def deactivate_user(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    user = user_repository.get(db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{id}/activate", response_model=UserSchema)
def activate_user(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    user = user_repository.get(db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{id}/reset-password")
def reset_user_password(
    id: str,
    password_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    user = user_repository.get(db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not password_in.password:
        raise HTTPException(status_code=400, detail="New password is required")
        
    user.password_hash = get_password_hash(password_in.password)
    db.commit()
    return {"message": f"Successfully reset password for operator {user.username}."}
