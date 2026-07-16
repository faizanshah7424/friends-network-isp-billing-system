from backend.app.schemas.base import CamelModel
from typing import Optional, List, Any
from datetime import datetime

class ComplaintBase(CamelModel):
    ticket_number: str
    customer_id: str
    customer_name: str
    mobile_number: str
    area: str
    category: str
    issue: str
    priority: Optional[str] = "Medium"
    assigned_engineer: Optional[str] = None
    status: Optional[str] = "Pending"
    date_created: str
    resolved_date: Optional[str] = None
    engineer_notes: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(CamelModel):
    priority: Optional[str] = None
    assigned_engineer: Optional[str] = None
    status: Optional[str] = None
    resolved_date: Optional[str] = None
    engineer_notes: Optional[str] = None
    timeline: Optional[List[Any]] = None

class ComplaintInDBBase(ComplaintBase):
    id: str
    timeline: List[Any] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComplaintSchema(ComplaintInDBBase):
    pass
