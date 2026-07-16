import uuid
from sqlalchemy import Column, String, Text, DateTime
from backend.app.database.session import Base
from datetime import datetime

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    user_id = Column(String(36), nullable=True)
    username = Column(String(100), nullable=False)
    action = Column(String(150), nullable=False)  # "Customer Added" | "Payment Received" etc.
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    browser = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
