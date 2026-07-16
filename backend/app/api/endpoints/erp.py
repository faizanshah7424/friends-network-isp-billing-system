from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.repositories.erp import branch_repository, inventory_repository, technician_repository
from backend.app.schemas.erp import (
    BranchSchema, BranchCreate,
    InventorySchema, InventoryCreate, InventoryUpdate,
    TechnicianSchema, TechnicianCreate, TechnicianUpdate
)

router = APIRouter()

# --- 1. Branch Endpoints ---
@router.get("/branches", response_model=List[BranchSchema])
def list_branches(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return branch_repository.get_multi(db)

@router.post("/branches", response_model=BranchSchema)
def create_branch(
    branch_in: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    dup = branch_repository.get_by_name(db, name=branch_in.name)
    if dup:
        raise HTTPException(status_code=400, detail="Branch name already exists.")
    return branch_repository.create(db, db_obj=branch_in)

# --- 2. Inventory Endpoints ---
@router.get("/inventory", response_model=List[InventorySchema])
def list_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return inventory_repository.get_multi(db)

@router.post("/inventory", response_model=InventorySchema)
def create_inventory_item(
    item_in: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    if item_in.serial_number:
        dup = inventory_repository.get_by_serial(db, serial_number=item_in.serial_number)
        if dup:
            raise HTTPException(status_code=400, detail="Serial number already registered.")
    return inventory_repository.create(db, db_obj=item_in)

@router.put("/inventory/{id}", response_model=InventorySchema)
def update_inventory_item(
    id: str,
    item_in: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    item = inventory_repository.get(db, id=id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    return inventory_repository.update(db, db_obj=item, obj_in=item_in)

@router.delete("/inventory/{id}", response_model=InventorySchema)
def delete_inventory_item(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    item = inventory_repository.get(db, id=id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    return inventory_repository.remove(db, id=id)

# --- 3. Technician Endpoints ---
@router.get("/technicians", response_model=List[TechnicianSchema])
def list_technicians(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return technician_repository.get_multi(db)

@router.post("/technicians", response_model=TechnicianSchema)
def create_technician(
    tech_in: TechnicianCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    dup = technician_repository.get_by_phone(db, phone=tech_in.phone)
    if dup:
        raise HTTPException(status_code=400, detail="Phone number already registered to a technician.")
    return technician_repository.create(db, db_obj=tech_in)

@router.put("/technicians/{id}", response_model=TechnicianSchema)
def update_technician(
    id: str,
    tech_in: TechnicianUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    tech = technician_repository.get(db, id=id)
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found.")
    return technician_repository.update(db, db_obj=tech, obj_in=tech_in)
