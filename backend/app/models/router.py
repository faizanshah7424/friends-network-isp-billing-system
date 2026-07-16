import uuid
from sqlalchemy import Column, String, Integer, DateTime
from backend.app.database.session import Base
from datetime import datetime

class Router(Base):
    __tablename__ = "routers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    ip_address = Column(String(50), nullable=False)
    api_port = Column(Integer, default=8728)
    username = Column(String(50), default="admin")
    password_encrypted = Column(String(255), nullable=False)
    location = Column(String(100), nullable=True)
    status = Column(String(50), default="Offline")  # "Online" | "Offline"
    last_connected = Column(String(50), nullable=True)
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
