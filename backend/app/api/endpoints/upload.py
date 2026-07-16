from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import os
import uuid
import shutil

from backend.app.api.deps import PermissionChecker
from backend.app.models.user import User
from backend.app.core.s3 import upload_to_storage, get_download_url

router = APIRouter()

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    # Restrict extensions for security
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx', '.csv']
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file format.")

    # Read file content and upload to S3/local
    content = await file.read()
    storage_url = upload_to_storage(content, filename, file.content_type or "application/octet-stream")
    public_url = get_download_url(storage_url)
    
    return {
        "filename": filename,
        "url": public_url,
        "storage_url": storage_url
    }
