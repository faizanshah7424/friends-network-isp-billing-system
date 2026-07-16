from backend.app.schemas.base import CamelModel
from typing import Optional
from datetime import datetime

class InvoiceBase(CamelModel):
    invoice_number: str
    customer_id: str
    customer_name: str
    billing_month: str
    monthly_charges: int
    previous_due: Optional[int] = 0
    additional_charges: Optional[int] = 0
    discount: Optional[int] = 0
    grand_total: int
    amount_paid: Optional[int] = 0
    outstanding_balance: Optional[int] = 0
    payment_status: Optional[str] = "Unpaid"
    billing_date: str
    due_date: str

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(CamelModel):
    amount_paid: Optional[int] = None
    outstanding_balance: Optional[int] = None
    payment_status: Optional[str] = None
    due_date: Optional[str] = None

class InvoiceInDBBase(InvoiceBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InvoiceSchema(InvoiceInDBBase):
    pass
