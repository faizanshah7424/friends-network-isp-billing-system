from backend.app.schemas.base import CamelModel
from typing import Optional

class SystemSettingsBase(CamelModel):
    company_name: str
    logo: Optional[str] = None
    phone: str
    email: str
    address: str
    currency: Optional[str] = "PKR"
    invoice_footer: Optional[str] = None
    receipt_footer: Optional[str] = None

class SystemSettingsCreate(SystemSettingsBase):
    pass

class SystemSettingsUpdate(CamelModel):
    company_name: Optional[str] = None
    logo: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    currency: Optional[str] = None
    invoice_footer: Optional[str] = None
    receipt_footer: Optional[str] = None

class SystemSettingsInDBBase(SystemSettingsBase):
    id: str

    class Config:
        from_attributes = True

class SystemSettingsSchema(SystemSettingsInDBBase):
    pass
