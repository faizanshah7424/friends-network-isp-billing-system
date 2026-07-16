from backend.app.schemas.base import CamelModel
from typing import Optional
from backend.app.schemas.role import RoleSchema

class UserBase(CamelModel):
    username: str
    full_name: str
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    role_id: str

class UserUpdate(CamelModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[str] = None

class UserInDBBase(UserBase):
    id: str
    role_id: str

    class Config:
        from_attributes = True

class UserSchema(UserInDBBase):
    role: Optional[RoleSchema] = None

class UserLogin(CamelModel):
    username: str
    password: str
