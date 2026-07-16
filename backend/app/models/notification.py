import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime
from backend.app.database.session import Base
from datetime import datetime

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    type = Column(String(50), nullable=False)  # "payment_received" | "new_customer" | "complaint_created" | "payment_pending"
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    date = Column(String(30), nullable=False)  # "2026-07-13 03:10 PM"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
