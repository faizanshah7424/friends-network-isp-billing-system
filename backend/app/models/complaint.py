import uuid
from sqlalchemy import Column, String, Text, JSON, DateTime, Float
from backend.app.database.session import Base
from datetime import datetime

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    ticket_number = Column(String(50), unique=True, nullable=False, index=True)  # e.g., TIC-1024
    customer_id = Column(String(50), nullable=False, index=True)
    customer_name = Column(String(150), nullable=False)
    mobile_number = Column(String(50), nullable=False)
    area = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)  # "Slow Speed" | "Fiber Outage" | "Router Configuration"
    issue = Column(Text, nullable=False)
    priority = Column(String(50), default="Medium")  # "Low" | "Medium" | "High" | "Critical"
    assigned_engineer = Column(String(100), nullable=True)
    status = Column(String(50), default="Pending")  # "Pending" | "Assigned" | "In Progress" | "Resolved"
    date_created = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    resolved_date = Column(String(10), nullable=True)  # "YYYY-MM-DD"
    engineer_notes = Column(Text, nullable=True)
    
    # Field Engineer mobile checkin/checkout metrics
    checkin_lat = Column(Float, nullable=True)
    checkin_lon = Column(Float, nullable=True)
    checkout_lat = Column(Float, nullable=True)
    checkout_lon = Column(Float, nullable=True)
    signature_url = Column(String(255), nullable=True)
    photo_url = Column(String(255), nullable=True)
    checkin_time = Column(String(50), nullable=True)
    checkout_time = Column(String(50), nullable=True)

    timeline = Column(JSON, default=list)  # Timeline events [{"status", "date", "comment"}]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
