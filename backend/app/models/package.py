import uuid
from sqlalchemy import Column, String, Integer, Text
from backend.app.database.session import Base

class Package(Base):
    __tablename__ = "packages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # "Social Media" | "Standard" | "Static IP"
    speed = Column(String(50), nullable=False)
    monthly_charges = Column(Integer, nullable=False)
    status = Column(String(50), default="Active")  # "Active" | "Inactive"
    description = Column(Text, nullable=True)
