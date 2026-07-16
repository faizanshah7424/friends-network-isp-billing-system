import uuid
from sqlalchemy import Column, String, Integer, Text, JSON, DateTime, ForeignKey
from backend.app.database.session import Base
from datetime import datetime

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(50), unique=True, nullable=False, index=True)  # FN-1001
    name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    whatsapp = Column(String(50), nullable=True)
    address = Column(Text, nullable=False)
    area = Column(String(100), nullable=False)
    package_id = Column(String(36), ForeignKey("packages.id"), nullable=False)
    package_name = Column(String(100), nullable=False)
    monthly_charges = Column(Integer, nullable=False)
    installation_charges = Column(Integer, default=0)
    router_mac = Column(String(100), nullable=True)
    onu_number = Column(String(100), nullable=True)
    router_id = Column(String(36), nullable=True)
    connection_type = Column(String(50), default="PPPoE")
    ppp_username = Column(String(100), nullable=True)
    ppp_password = Column(String(100), nullable=True)
    hotspot_username = Column(String(100), nullable=True)
    hotspot_password = Column(String(100), nullable=True)
    connection_date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    connection_status = Column(String(50), default="Active")  # "Active" | "Inactive"
    payment_status = Column(String(50), default="Unpaid")  # "Paid" | "Unpaid" | "Pending"
    outstanding_balance = Column(Integer, default=0)
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    portal_password_hash = Column(String(255), nullable=True)
    timeline = Column(JSON, default=list)  # Timeline events list
    notes = Column(JSON, default=list)  # Notes list
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
