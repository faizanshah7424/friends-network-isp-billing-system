from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.tenant import Tenant
from backend.app.repositories.tenant import tenant_repository
from backend.app.schemas.tenant import TenantSchema, TenantCreate, TenantUpdate
from backend.app.models.log import ActivityLog
from backend.app.repositories.log import activity_log_repository
from backend.app.core.tenant import tenant_context

router = APIRouter()

@router.get("/active", response_model=TenantSchema)
def get_active_tenant(
    db: Session = Depends(get_db)
):
    # Query bypassing tenant filter to retrieve the Tenant configuration object itself
    tid = tenant_context.get()
    tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.id == tid).first()
    if not tenant:
        tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.id == "friends_network").first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Active tenant configuration not found")
    return tenant

@router.get("/", response_model=List[TenantSchema])
def list_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    # Query bypassing tenant filter to list all tenants for Super Platform Admin
    return db.query(Tenant).execution_options(bypass_tenant=True).all()

@router.post("/", response_model=TenantSchema)
def create_tenant(
    tenant_in: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    dup = tenant_repository.get_by_name(db, name=tenant_in.name)
    if dup:
        raise HTTPException(status_code=400, detail="Tenant name already exists")
    
    tenant_db = Tenant(
        name=tenant_in.name,
        domain=tenant_in.domain,
        subscription_plan=tenant_in.subscription_plan or "Starter",
        status="Active",
        brand_name=tenant_in.brand_name or tenant_in.name,
        email=tenant_in.email,
        phone=tenant_in.phone,
        address=tenant_in.address,
        theme_color=tenant_in.theme_color or "indigo",
        timezone=tenant_in.timezone or "UTC",
        currency=tenant_in.currency or "PKR",
        language=tenant_in.language or "en",
        invoice_footer=tenant_in.invoice_footer,
        receipt_footer=tenant_in.receipt_footer,
        customer_limit=tenant_in.customer_limit or 100,
        storage_limit=tenant_in.storage_limit or 1000,
        subscription_expiry=tenant_in.subscription_expiry,
        payment_status="Paid",
        is_activated=True
    )
    created = tenant_repository.create(db, db_obj=tenant_db)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Tenant Created",
        details=f"Registered SaaS tenant ISP: {created.name}"
    )
    activity_log_repository.create(db, db_obj=log)

    return created

@router.put("/{id}", response_model=TenantSchema)
def update_tenant(
    id: str,
    tenant_in: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.id == id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    updated = tenant_repository.update(db, db_obj=tenant, obj_in=tenant_in)
    return updated

@router.delete("/{id}", response_model=TenantSchema)
def delete_tenant(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.id == id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    db.delete(tenant)
    db.commit()
    return tenant

@router.post("/{id}/suspend", response_model=TenantSchema)
def suspend_tenant(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.id == id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    tenant.status = "Suspended"
    tenant.is_activated = False
    db.commit()
    db.refresh(tenant)
    return tenant

@router.post("/{id}/activate", response_model=TenantSchema)
def activate_tenant(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.id == id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    tenant.status = "Active"
    tenant.is_activated = True
    db.commit()
    db.refresh(tenant)
    return tenant
