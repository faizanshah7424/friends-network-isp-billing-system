from backend.app.schemas.base import CamelModel
from typing import Optional
from datetime import datetime

class PaymentBase(CamelModel):
    receipt_number: str
    customer_id: str
    customer_name: str
    amount_received: int
    payment_method: str
    reference_number: Optional[str] = None
    payment_date: str
    billing_month: str
    received_by: str

class PaymentCreate(PaymentBase):
    pass

class PaymentInDBBase(PaymentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentSchema(PaymentInDBBase):
    pass
