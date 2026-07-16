from backend.app.schemas.base import CamelModel
from typing import Optional

class PackageBase(CamelModel):
    name: str
    category: str  # "Social Media" | "Standard" | "Static IP"
    speed: str
    monthly_charges: int
    status: Optional[str] = "Active"  # "Active" | "Inactive"
    description: Optional[str] = None

class PackageCreate(PackageBase):
    pass

class PackageUpdate(CamelModel):
    name: Optional[str] = None
    category: Optional[str] = None
    speed: Optional[str] = None
    monthly_charges: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None

class PackageInDBBase(PackageBase):
    id: str

    class Config:
        from_attributes = True

class PackageSchema(PackageInDBBase):
    pass
