from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.notification import Notification
from backend.app.repositories.notification import notification_repository
from backend.app.schemas.notification import NotificationSchema

router = APIRouter()

@router.get("/", response_model=List[NotificationSchema])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return notification_repository.get_multi(db)

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"unreadCount": count}

@router.post("/{id}/read", response_model=NotificationSchema)
def mark_as_read(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    notif = notification_repository.get(db, id=id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif
