import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime
from backend.app.database.session import Base
from datetime import datetime

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    title = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)  # "Office Rent" | "Fuel" | "Hardware" etc.
    amount = Column(Integer, nullable=False)
    date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
