from backend.app.schemas.base import CamelModel
from typing import Optional
from datetime import datetime

# 1. Branch Schemas
class BranchBase(CamelModel):
    name: str
    location: Optional[str] = None

class BranchCreate(BranchBase):
    pass

class BranchSchema(BranchBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# 2. Inventory Schemas
class InventoryBase(CamelModel):
    name: str
    category: str
    serial_number: Optional[str] = None
    status: Optional[str] = "In Stock"
    purchase_price: Optional[int] = 0
    selling_price: Optional[int] = 0
    purchase_date: Optional[str] = None
    supplier: Optional[str] = None
    warranty_months: Optional[int] = 12
    quantity: Optional[int] = 1
    low_stock_threshold: Optional[int] = 5
    branch_id: Optional[str] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(CamelModel):
    name: Optional[str] = None
    category: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None
    purchase_price: Optional[int] = None
    selling_price: Optional[int] = None
    purchase_date: Optional[str] = None
    supplier: Optional[str] = None
    warranty_months: Optional[int] = None
    quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    branch_id: Optional[str] = None

class InventorySchema(InventoryBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# 3. Technician Schemas
class TechnicianBase(CamelModel):
    full_name: str
    phone: str
    cnic: Optional[str] = None
    assigned_area: Optional[str] = None
    vehicle: Optional[str] = None
    availability: Optional[str] = "Available"
    branch_id: Optional[str] = None

class TechnicianCreate(TechnicianBase):
    pass

class TechnicianUpdate(CamelModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    cnic: Optional[str] = None
    assigned_area: Optional[str] = None
    vehicle: Optional[str] = None
    availability: Optional[str] = None
    branch_id: Optional[str] = None
    completed_jobs: Optional[int] = None
    avg_resolution_time_mins: Optional[int] = None

class TechnicianSchema(TechnicianBase):
    id: str
    completed_jobs: int
    avg_resolution_time_mins: int
    created_at: datetime
    class Config:
        from_attributes = True
