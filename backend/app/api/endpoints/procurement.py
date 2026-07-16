from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user
from backend.app.models.user import User
from backend.app.models.erp import InventoryItem

router = APIRouter()

# In-memory mock database store for suppliers and purchase orders to keep sqlite backwards compatible
# and avoid complex model changes while maintaining a feature-rich, high-performance module.
MOCK_SUPPLIERS = [
    {"id": "sup-1", "name": "Optics Tech Karachi", "contact": "021-3456789", "email": "sales@opticstech.pk", "outstanding": 15000},
    {"id": "sup-2", "name": "Hassan Fiber Cables", "contact": "0300-1234567", "email": "info@hassanfiber.com", "outstanding": 42000},
    {"id": "sup-3", "name": "MikroTik Distributor Pakistan", "contact": "021-9988776", "email": "imports@mikrotik.com.pk", "outstanding": 0}
]

MOCK_POS = [
    {"id": "po-1001", "supplierName": "Optics Tech Karachi", "date": "2026-07-10", "totalAmount": 75000, "status": "Received"},
    {"id": "po-1002", "supplierName": "Hassan Fiber Cables", "date": "2026-07-15", "totalAmount": 120000, "status": "Pending"}
]

MOCK_LEDGER = [
    {"id": "tx-1", "supplierName": "Optics Tech Karachi", "date": "2026-07-10", "description": "Goods Received PO-1001", "debit": 75000, "credit": 0, "balance": 75000},
    {"id": "tx-2", "supplierName": "Optics Tech Karachi", "date": "2026-07-11", "description": "Payment via Bank Transfer", "debit": 0, "credit": 60000, "balance": 15000}
]

class SupplierCreate(BaseModel):
    name: str
    contact: str
    email: str

class POCreate(BaseModel):
    supplier_id: str
    items: List[dict]
    total_amount: int

class GoodsReceiveRequest(BaseModel):
    po_id: str
    items: List[dict]  # [{"name": "GPON ONU", "quantity": 50, "price": 1800, "category": "ONUs"}]

@router.get("/suppliers")
def get_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return MOCK_SUPPLIERS

@router.post("/suppliers")
def create_supplier(
    req: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_sup = {
        "id": f"sup-{len(MOCK_SUPPLIERS) + 1}",
        "name": req.name,
        "contact": req.contact,
        "email": req.email,
        "outstanding": 0
    }
    MOCK_SUPPLIERS.append(new_sup)
    return new_sup

@router.get("/purchase-orders")
def get_purchase_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return MOCK_POS

@router.post("/purchase-orders")
def create_purchase_order(
    req: POCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    supplier = next((s for s in MOCK_SUPPLIERS if s["id"] == req.supplier_id), None)
    sup_name = supplier["name"] if supplier else "Unknown Supplier"
    
    new_po = {
        "id": f"po-{1000 + len(MOCK_POS) + 1}",
        "supplierName": sup_name,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "totalAmount": req.total_amount,
        "status": "Pending"
    }
    MOCK_POS.append(new_po)
    return new_po

@router.post("/goods-receiving")
def receive_goods(
    req: GoodsReceiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Locate PO
    po = next((p for p in MOCK_POS if p["id"] == req.po_id), None)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    po["status"] = "Received"
    
    # Increment our SQLite Inventory stock!
    for item in req.items:
        # Check if item exists in InventoryItem SQLite table
        exists = db.query(InventoryItem).filter(InventoryItem.name == item["name"]).first()
        if exists:
            exists.quantity += item["quantity"]
        else:
            new_inv = InventoryItem(
                name=item["name"],
                category=item.get("category", "Routers"),
                quantity=item["quantity"],
                purchase_price=item.get("price", 1000),
                selling_price=int(item.get("price", 1000) * 1.3),
                status="In Stock"
            )
            db.add(new_inv)
            
    db.commit()
    return {"status": "Success", "message": "Inventory quantities updated from purchase receipt"}

@router.get("/vendor-ledger")
def get_vendor_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return MOCK_LEDGER
