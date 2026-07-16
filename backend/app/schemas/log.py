from backend.app.schemas.base import CamelModel
from typing import Optional
from datetime import datetime

class ActivityLogBase(CamelModel):
    user_id: Optional[str] = None
    username: str
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    browser: Optional[str] = None

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLogInDBBase(ActivityLogBase):
    id: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ActivityLogSchema(ActivityLogInDBBase):
    pass
