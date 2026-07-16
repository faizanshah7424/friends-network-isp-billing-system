from backend.app.schemas.base import CamelModel
from typing import Optional
from datetime import datetime

class RouterBase(CamelModel):
    name: str
    ip_address: str
    api_port: Optional[int] = 8728
    username: Optional[str] = "admin"
    location: Optional[str] = None

class RouterCreate(RouterBase):
    password: str

class RouterUpdate(CamelModel):
    name: Optional[str] = None
    ip_address: Optional[str] = None
    api_port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    location: Optional[str] = None

class RouterSchema(RouterBase):
    id: str
    status: str
    last_connected: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
