import uuid
from sqlalchemy import Column, String, Integer, DateTime
from backend.app.database.session import Base
from datetime import datetime

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)  # e.g., INV-2026-1001
    customer_id = Column(String(50), nullable=False, index=True)  # Customer's business ID
    customer_name = Column(String(150), nullable=False)
    billing_month = Column(String(50), nullable=False)  # "July 2026"
    monthly_charges = Column(Integer, nullable=False)
    previous_due = Column(Integer, default=0)
    additional_charges = Column(Integer, default=0)
    discount = Column(Integer, default=0)
    grand_total = Column(Integer, nullable=False)
    amount_paid = Column(Integer, default=0)
    outstanding_balance = Column(Integer, default=0)
    payment_status = Column(String(50), default="Unpaid")  # "Paid" | "Unpaid" | "Pending"
    billing_date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    due_date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
