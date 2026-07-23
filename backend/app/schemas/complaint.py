from backend.app.schemas.base import CamelModel
from typing import Optional, List, Any
from datetime import datetime

class ComplaintBase(CamelModel):
    ticket_number: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    mobile_number: Optional[str] = None
    area: Optional[str] = None
    category: Optional[str] = "General Outage"
    issue: str
    priority: Optional[str] = "Medium"
    assigned_engineer: Optional[str] = None
    status: Optional[str] = "Pending"
    date_created: Optional[str] = None
    resolved_date: Optional[str] = None
    engineer_notes: Optional[str] = None

class ComplaintCreate(CamelModel):
    customer_id: str
    mobile_number: Optional[str] = None
    category: Optional[str] = "General Outage"
    issue: str
    priority: Optional[str] = "Medium"
    assigned_engineer: Optional[str] = None

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
