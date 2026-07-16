from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user
from backend.app.models.user import User
from backend.app.core.s3 import upload_to_storage

router = APIRouter()

MOCK_DOCUMENTS = [
    {"id": "doc-1", "title": "Karachi Region Standard Customer Agreement", "category": "Agreements", "version": "v2.1", "uploadedBy": "Muhammad Shahid", "uploadedAt": "2026-07-01", "url": "/static/uploads/agreement_template.pdf"},
    {"id": "doc-2", "title": "Technician standard installation audit checklist", "category": "Reports", "version": "v1.0", "uploadedBy": "Noor Jamal", "uploadedAt": "2026-07-15", "url": "/static/uploads/installation_checklist.pdf"}
]

@router.get("/")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return MOCK_DOCUMENTS

@router.post("/upload")
async def upload_document(
    title: str,
    category: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    content = await file.read()
    # Upload document to s3 cloud storage
    url = upload_to_storage(content, file.filename, file.content_type or "application/pdf")
    
    new_doc = {
        "id": f"doc-{len(MOCK_DOCUMENTS) + 1}",
        "title": title,
        "category": category,
        "version": "v1.0",
        "uploadedBy": current_user.full_name,
        "uploadedAt": datetime.now().strftime("%Y-%m-%d"),
        "url": url
    }
    MOCK_DOCUMENTS.append(new_doc)
    return new_doc
