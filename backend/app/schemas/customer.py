from backend.app.schemas.base import CamelModel
from typing import Optional, List, Any
from datetime import datetime

class CustomerBase(CamelModel):
    customer_id: str
    name: str
    phone: str
    whatsapp: Optional[str] = None
    address: str
    area: str
    package_id: str
    package_name: Optional[str] = None
    monthly_charges: Optional[int] = None
    installation_charges: Optional[int] = 0
    router_mac: Optional[str] = None
    onu_number: Optional[str] = None
    router_id: Optional[str] = None
    connection_type: Optional[str] = "PPPoE"
    ppp_username: Optional[str] = None
    ppp_password: Optional[str] = None
    hotspot_username: Optional[str] = None
    hotspot_password: Optional[str] = None
    connection_date: str
    connection_status: Optional[str] = "Active"
    payment_status: Optional[str] = "Unpaid"
    outstanding_balance: Optional[int] = 0

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CamelModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    address: Optional[str] = None
    area: Optional[str] = None
    package_id: Optional[str] = None
    package_name: Optional[str] = None
    monthly_charges: Optional[int] = None
    installation_charges: Optional[int] = None
    router_mac: Optional[str] = None
    onu_number: Optional[str] = None
    router_id: Optional[str] = None
    connection_type: Optional[str] = None
    ppp_username: Optional[str] = None
    ppp_password: Optional[str] = None
    hotspot_username: Optional[str] = None
    hotspot_password: Optional[str] = None
    connection_status: Optional[str] = None
    payment_status: Optional[str] = None
    outstanding_balance: Optional[int] = None

class CustomerInDBBase(CustomerBase):
    id: str
    timeline: List[Any] = []
    notes: List[Any] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomerSchema(CustomerInDBBase):
    pass
