import uuid
from sqlalchemy import Column, String, DateTime, Integer, Boolean
from backend.app.database.session import Base
from datetime import datetime

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(100), unique=True, nullable=True, index=True)
    subscription_plan = Column(String(50), default="Starter") # "Starter" | "Professional" | "Business" | "Enterprise"
    status = Column(String(50), default="Active") # "Active" | "Suspended"
    logo_url = Column(String(200), nullable=True)
    brand_name = Column(String(150), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    theme_color = Column(String(50), default="indigo")
    timezone = Column(String(50), default="UTC")
    currency = Column(String(10), default="PKR")
    language = Column(String(10), default="en")
    invoice_footer = Column(String(500), nullable=True)
    receipt_footer = Column(String(500), nullable=True)
    customer_limit = Column(Integer, default=100)
    storage_limit = Column(Integer, default=1000) # in MB
    storage_used = Column(Integer, default=0) # in bytes
    subscription_expiry = Column(DateTime, nullable=True)
    payment_status = Column(String(50), default="Paid")
    license_key = Column(String(100), nullable=True)
    hardware_fingerprint = Column(String(100), nullable=True)
    is_activated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
