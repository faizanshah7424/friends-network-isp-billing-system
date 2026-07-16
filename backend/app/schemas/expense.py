from backend.app.schemas.base import CamelModel
from typing import Optional
from datetime import datetime

class ExpenseBase(CamelModel):
    title: str
    category: str
    amount: int
    date: str
    description: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(CamelModel):
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[int] = None
    date: Optional[str] = None
    description: Optional[str] = None

class ExpenseInDBBase(ExpenseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseSchema(ExpenseInDBBase):
    pass
