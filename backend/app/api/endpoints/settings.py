from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.settings import SystemSettings
from backend.app.repositories.settings import settings_repository
from backend.app.repositories.log import activity_log_repository
from backend.app.models.log import ActivityLog
from backend.app.schemas.settings import SystemSettingsSchema, SystemSettingsUpdate

router = APIRouter()

@router.get("/", response_model=SystemSettingsSchema)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return settings_repository.get_latest(db)

@router.put("/", response_model=SystemSettingsSchema)
def update_settings(
    settings_in: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    settings_obj = settings_repository.get_latest(db)
    updated = settings_repository.update(db, db_obj=settings_obj, obj_in=settings_in)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="System Settings Updated",
        details="Modified global Friends Network company parameters / billing policies"
    )
    activity_log_repository.create(db, db_obj=log)

    return updated
