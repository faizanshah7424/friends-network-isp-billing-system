from backend.app.schemas.base import CamelModel
from typing import Optional
from datetime import datetime

class TenantBase(CamelModel):
    name: str
    domain: Optional[str] = None
    subscription_plan: Optional[str] = "Starter"
    brand_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    theme_color: Optional[str] = "indigo"
    timezone: Optional[str] = "UTC"
    currency: Optional[str] = "PKR"
    language: Optional[str] = "en"
    invoice_footer: Optional[str] = None
    receipt_footer: Optional[str] = None
    customer_limit: Optional[int] = 100
    storage_limit: Optional[int] = 1000
    storage_used: Optional[int] = 0
    subscription_expiry: Optional[datetime] = None
    payment_status: Optional[str] = "Paid"
    license_key: Optional[str] = None
    hardware_fingerprint: Optional[str] = None
    is_activated: Optional[bool] = True

class TenantCreate(TenantBase):
    pass

class TenantUpdate(CamelModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    subscription_plan: Optional[str] = None
    status: Optional[str] = None
    logo_url: Optional[str] = None
    brand_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    theme_color: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    language: Optional[str] = None
    invoice_footer: Optional[str] = None
    receipt_footer: Optional[str] = None
    customer_limit: Optional[int] = None
    storage_limit: Optional[int] = None
    subscription_expiry: Optional[datetime] = None
    payment_status: Optional[str] = None
    license_key: Optional[str] = None
    hardware_fingerprint: Optional[str] = None
    is_activated: Optional[bool] = None

class TenantSchema(TenantBase):
    id: str
    status: str
    logo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
