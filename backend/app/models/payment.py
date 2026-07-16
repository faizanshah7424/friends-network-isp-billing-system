import uuid
from sqlalchemy import Column, String, Integer, DateTime
from backend.app.database.session import Base
from datetime import datetime

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    receipt_number = Column(String(50), unique=True, nullable=False, index=True)  # REC-2026-1001
    customer_id = Column(String(50), nullable=False, index=True)
    customer_name = Column(String(150), nullable=False)
    amount_received = Column(Integer, nullable=False)
    payment_method = Column(String(50), nullable=False)  # "Cash" | "Bank" | "JazzCash" | "EasyPaisa"
    reference_number = Column(String(100), nullable=True)
    payment_date = Column(String(30), nullable=False)  # "2026-07-03 10:15 AM"
    billing_month = Column(String(50), nullable=False)  # "July 2026"
    received_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
