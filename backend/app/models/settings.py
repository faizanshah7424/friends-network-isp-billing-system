import uuid
from sqlalchemy import Column, String, Text
from backend.app.database.session import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    company_name = Column(String(150), nullable=False)
    logo = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    currency = Column(String(10), default="PKR")
    invoice_footer = Column(Text, nullable=True)
    receipt_footer = Column(Text, nullable=True)
