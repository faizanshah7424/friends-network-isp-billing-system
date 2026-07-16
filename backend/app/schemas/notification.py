from backend.app.schemas.base import CamelModel
from typing import Optional
from datetime import datetime

class NotificationBase(CamelModel):
    type: str
    title: str
    message: str
    date: str
    is_read: Optional[bool] = False

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(CamelModel):
    is_read: Optional[bool] = None

class NotificationInDBBase(NotificationBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationSchema(NotificationInDBBase):
    pass
