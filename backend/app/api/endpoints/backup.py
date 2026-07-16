from fastapi import APIRouter, Depends, HTTPException
import os
import shutil

from backend.app.api.deps import PermissionChecker
from backend.app.models.user import User

router = APIRouter()

@router.post("/create")
def create_backup(
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    db_file = "friends_network.db"
    backup_dest = "backend/static/uploads/friends_network_backup.db"
    
    if os.path.exists(db_file):
        os.makedirs(os.path.dirname(backup_dest), exist_ok=True)
        shutil.copy2(db_file, backup_dest)
        return {
            "message": "Database backup created successfully.",
            "downloadUrl": "/static/uploads/friends_network_backup.db"
        }
    else:
        raise HTTPException(
            status_code=400, 
            detail="Backup is only supported for local SQLite database configurations."
        )

@router.post("/restore")
def restore_backup(
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    db_file = "friends_network.db"
    backup_source = "backend/static/uploads/friends_network_backup.db"
    
    if os.path.exists(backup_source):
        shutil.copy2(backup_source, db_file)
        return {
            "message": "Database restored successfully from last backup."
        }
    else:
        raise HTTPException(
            status_code=404, 
            detail="No previous backup file found to restore from."
        )
