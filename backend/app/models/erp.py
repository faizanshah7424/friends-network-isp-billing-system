import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float
from backend.app.database.session import Base
from datetime import datetime

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    location = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False) # "Routers" | "ONUs" | "Fiber Cable" | "Splitters" | "UPS"
    serial_number = Column(String(100), unique=True, nullable=True, index=True)
    status = Column(String(50), default="In Stock") # "In Stock" | "Assigned" | "Defective"
    purchase_price = Column(Integer, default=0)
    selling_price = Column(Integer, default=0)
    purchase_date = Column(String(10), nullable=True) # "YYYY-MM-DD"
    supplier = Column(String(100), nullable=True)
    warranty_months = Column(Integer, default=12)
    quantity = Column(Integer, default=1)
    low_stock_threshold = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)

class Technician(Base):
    __tablename__ = "technicians"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), default="friends_network", nullable=True)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    cnic = Column(String(50), nullable=True)
    assigned_area = Column(String(100), nullable=True)
    vehicle = Column(String(100), nullable=True)
    availability = Column(String(50), default="Available") # "Available" | "On Duty" | "Off Duty"
    completed_jobs = Column(Integer, default=0)
    avg_resolution_time_mins = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
