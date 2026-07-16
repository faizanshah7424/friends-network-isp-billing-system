from backend.app.schemas.base import CamelModel
from typing import Optional, List

class RoleBase(CamelModel):
    name: str
    permissions: Optional[List[str]] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    name: Optional[str] = None

class RoleInDBBase(RoleBase):
    id: str

    class Config:
        from_attributes = True

class RoleSchema(RoleInDBBase):
    pass
