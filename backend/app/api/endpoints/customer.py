from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.customer import Customer
from backend.app.repositories.customer import customer_repository
from backend.app.repositories.package import package_repository
from backend.app.repositories.log import activity_log_repository
from backend.app.models.log import ActivityLog
from backend.app.schemas.customer import CustomerSchema, CustomerCreate, CustomerUpdate

router = APIRouter()

@router.get("/", response_model=List[CustomerSchema])
def list_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return customer_repository.get_multi(db)

@router.get("/{id}", response_model=CustomerSchema)
def get_customer(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    customer = customer_repository.get(db, id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/", response_model=CustomerSchema)
def register_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    # Check duplicate Customer ID
    dup_id = customer_repository.get_by_customer_id(db, customer_id=customer_in.customer_id)
    if dup_id:
        raise HTTPException(status_code=400, detail=f"Customer ID '{customer_in.customer_id}' is already registered")

    # Check duplicate Mobile
    dup_phone = customer_repository.get_by_phone(db, phone=customer_in.phone)
    if dup_phone:
        raise HTTPException(status_code=400, detail=f"Mobile number '{customer_in.phone}' is already registered")

    # Safe Package Lookup with fallbacks
    pkg = package_repository.get(db, id=customer_in.package_id)
    if not pkg:
        pkg = db.query(Package).filter(
            (Package.id == customer_in.package_id) | 
            (Package.name == customer_in.package_id) | 
            (Package.name == customer_in.package_name)
        ).first()

    pkg_id = pkg.id if pkg else customer_in.package_id
    pkg_name = pkg.name if pkg else (customer_in.package_name or "Standard Package")
    pkg_charges = pkg.monthly_charges if pkg else (customer_in.monthly_charges or 2000)

    # Construct customer object
    cust_db = Customer(
        customer_id=customer_in.customer_id,
        name=customer_in.name,
        phone=customer_in.phone,
        whatsapp=customer_in.whatsapp or customer_in.phone,
        address=customer_in.address,
        area=customer_in.area,
        package_id=pkg_id,
        package_name=pkg_name,
        monthly_charges=pkg_charges,
        installation_charges=customer_in.installation_charges or 0,
        router_mac=customer_in.router_mac,
        onu_number=customer_in.onu_number,
        connection_date=customer_in.connection_date,
        connection_status=customer_in.connection_status or "Active",
        payment_status=customer_in.payment_status or "Unpaid",
        outstanding_balance=customer_in.outstanding_balance or (customer_in.installation_charges or 0),
        timeline=[
            {
                "id": str(uuid.uuid4()),
                "title": "Connection Activated",
                "description": f"ONT registered and line activated under {pkg_name} package.",
                "date": customer_in.connection_date,
                "type": "success"
            }
        ],
        notes=[]
    )
    
    created = customer_repository.create(db, db_obj=cust_db)

    from backend.app.core.events import event_system
    event_system.trigger_event_sync(
        db=db,
        tenant_id=created.tenant_id or "friends_network",
        event_type="Customer Created",
        title="New Customer Created",
        message=f"Customer {created.name} ({created.customer_id}) has been added.",
        details=f"Registered customer {created.name} ({created.customer_id}) on package {created.package_name}",
        user_id=current_user.id,
        username=current_user.username
    )

    return created

@router.put("/{id}", response_model=CustomerSchema)
def update_customer(
    id: str,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    customer = customer_repository.get_by_customer_id(db, customer_id=id)
    if not customer:
        customer = customer_repository.get(db, id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    # If package changed, update package info
    if customer_in.package_id and customer_in.package_id != customer.package_id:
        pkg = package_repository.get(db, id=customer_in.package_id)
        if not pkg:
            raise HTTPException(status_code=400, detail="Invalid package selected")
        customer.package_id = pkg.id
        customer.package_name = pkg.name
        customer.monthly_charges = pkg.monthly_charges

    updated = customer_repository.update(db, db_obj=customer, obj_in=customer_in)
    
    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Customer Updated",
        details=f"Updated details for customer {updated.name} ({updated.customer_id})"
    )
    activity_log_repository.create(db, db_obj=log)
    
    return updated

@router.delete("/{id}", response_model=CustomerSchema)
def delete_customer(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    customer = customer_repository.get(db, id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    deleted = customer_repository.remove(db, id=id)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Customer Deleted",
        details=f"Deleted customer account {deleted.name} ({deleted.customer_id})"
    )
    activity_log_repository.create(db, db_obj=log)

    return deleted

@router.post("/{id}/suspend", response_model=CustomerSchema)
def suspend_customer(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    customer = customer_repository.get(db, id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.connection_status = "Inactive"
    
    # Append event to timeline
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    customer.timeline = list(customer.timeline) + [{
        "id": str(uuid.uuid4()),
        "title": "Connection Suspended",
        "description": f"Service connection suspended by staff ({current_user.username}).",
        "date": now_str,
        "type": "danger"
    }]
    
    db.commit()
    db.refresh(customer)

    # Sync state to MikroTik in background / synchronously
    from backend.app.core.mikrotik_service import sync_customer_to_router
    sync_customer_to_router(db, customer, disable=True)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Connection Suspended",
        details=f"Suspended connection for customer {customer.name} ({customer.customer_id})"
    )
    activity_log_repository.create(db, db_obj=log)

    return customer

@router.post("/{id}/activate", response_model=CustomerSchema)
def activate_customer(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    customer = customer_repository.get(db, id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.connection_status = "Active"
    
    # Append event to timeline
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    customer.timeline = list(customer.timeline) + [{
        "id": str(uuid.uuid4()),
        "title": "Connection Restored",
        "description": f"Service connection restored by staff ({current_user.username}).",
        "date": now_str,
        "type": "success"
    }]
    
    db.commit()
    db.refresh(customer)

    # Sync state to MikroTik in background / synchronously
    from backend.app.core.mikrotik_service import sync_customer_to_router
    sync_customer_to_router(db, customer, disable=False)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Connection Restored",
        details=f"Activated connection for customer {customer.name} ({customer.customer_id})"
    )
    activity_log_repository.create(db, db_obj=log)

    return customer

@router.post("/{id}/notes", response_model=CustomerSchema)
def add_note(
    id: str,
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    customer = customer_repository.get(db, id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    note_obj = {
        "id": str(uuid.uuid4()),
        "content": content,
        "date": now_str,
        "user": current_user.username
    }
    
    customer.notes = list(customer.notes) + [note_obj]
    db.commit()
    db.refresh(customer)

    return customer

from fastapi import UploadFile, File
from backend.app.schemas.base import CamelModel
from backend.app.models.package import Package
import pandas as pd
import io

class ImportCommitItem(CamelModel):
    id: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    area: Optional[str] = None
    packageId: str
    routerMac: Optional[str] = None
    connectionStatus: str

class ImportCommitRequest(CamelModel):
    customers: List[ImportCommitItem]
    updateExisting: bool = False

@router.post("/import-preview")
def import_preview(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    content = file.file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload Excel or CSV.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Clean headers
    df.columns = [str(c).strip() for c in df.columns]
    
    # Map columns
    col_mapping = {}
    for col in df.columns:
        c_lower = col.lower()
        if 'id' in c_lower or 'user id' in c_lower:
            col_mapping['id'] = col
        elif 'name' in c_lower or 'user name' in c_lower:
            col_mapping['name'] = col
        elif 'phone' in c_lower or 'mobile' in c_lower:
            col_mapping['phone'] = col
        elif 'address' in c_lower:
            col_mapping['address'] = col
        elif 'area' in c_lower:
            col_mapping['area'] = col
        elif 'package' in c_lower:
            col_mapping['package'] = col
        elif 'mac' in c_lower:
            col_mapping['mac'] = col
        elif 'status' in c_lower:
            col_mapping['status'] = col

    required = ['id', 'name', 'package']
    missing = [r for r in required if r not in col_mapping]
    if missing:
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required columns in file. Ensure columns mapping to: {', '.join(missing)}"
        )

    preview_records = []
    duplicate_count = 0
    validation_errors = []
    
    existing_ids = {c.customer_id for c in db.query(Customer).all()}
    all_packages = {p.name.lower(): p for p in db.query(Package).all()}

    for index, row in df.iterrows():
        row_id = str(row.get(col_mapping['id'], '')).strip()
        row_name = str(row.get(col_mapping['name'], '')).strip()
        
        if not row_id or row_id == 'nan' or not row_name or row_name == 'nan':
            continue
            
        row_phone = str(row.get(col_mapping.get('phone', ''), '')).strip()
        if row_phone == 'nan': row_phone = ''
        
        row_address = str(row.get(col_mapping.get('address', ''), '')).strip()
        if row_address == 'nan': row_address = ''
        
        row_area = str(row.get(col_mapping.get('area', ''), 'Jamali Goth')).strip()
        if row_area == 'nan': row_area = 'Jamali Goth'
        
        row_package = str(row.get(col_mapping['package'], '')).strip()
        
        row_mac = str(row.get(col_mapping.get('mac', ''), '')).strip()
        if row_mac == 'nan': row_mac = ''
        
        row_status = str(row.get(col_mapping.get('status', ''), 'Active')).strip()
        if 'inactive' in row_status.lower() or 'suspend' in row_status.lower():
            row_status = 'Inactive'
        else:
            row_status = 'Active'

        is_duplicate = row_id in existing_ids
        if is_duplicate:
            duplicate_count += 1

        # Match package
        clean_pkg_match = row_package.lower()
        matched_pkg = None
        for p_name_lower, p_obj in all_packages.items():
            if p_name_lower in clean_pkg_match or clean_pkg_match in p_name_lower:
                matched_pkg = p_obj
                break
                
        if matched_pkg:
            pkg_id = matched_pkg.id
            pkg_name = matched_pkg.name
            monthly_charges = matched_pkg.monthly_charges
        else:
            validation_errors.append(f"Row {index + 1}: Package '{row_package}' not found. Defaulting to Basic.")
            pkg_id = "pkg-std-basic"
            pkg_name = "Basic"
            monthly_charges = 2000

        preview_records.append({
            "id": row_id,
            "name": row_name,
            "phone": row_phone,
            "address": row_address,
            "area": row_area,
            "packageName": pkg_name,
            "packageId": pkg_id,
            "monthlyCharges": monthly_charges,
            "routerMac": row_mac,
            "connectionStatus": row_status,
            "isDuplicate": is_duplicate,
            "isValid": True
        })

    return {
        "summary": {
            "totalCount": len(preview_records),
            "duplicateCount": duplicate_count,
            "newCount": len(preview_records) - duplicate_count,
            "errorCount": len(validation_errors)
        },
        "errors": validation_errors,
        "preview": preview_records
    }

@router.post("/import-commit")
def import_commit(
    payload: ImportCommitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    inserted_count = 0
    updated_count = 0
    now_str = datetime.now().strftime("%Y-%m-%d")
    now_time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for item in payload.customers:
        customer = customer_repository.get_by_customer_id(db, customer_id=item.id)
        if not customer:
            customer = customer_repository.get(db, id=item.id)

        pkg = db.query(Package).filter(Package.id == item.packageId).first()
        pkg_name = pkg.name if pkg else "Basic"
        monthly_charges = pkg.monthly_charges if pkg else 2000

        if customer:
            if not payload.updateExisting:
                continue
                
            customer.name = item.name
            customer.phone = item.phone or customer.phone
            customer.address = item.address or customer.address
            customer.area = item.area or customer.area
            customer.package_id = item.packageId
            customer.package_name = pkg_name
            customer.monthly_charges = monthly_charges
            customer.router_mac = item.routerMac or customer.router_mac
            customer.connection_status = item.connectionStatus
            
            customer.timeline = list(customer.timeline) + [{
                "id": str(uuid.uuid4()),
                "title": "Profile Updated (Import)",
                "description": f"Customer record updated via batch import.",
                "date": now_time_str,
                "type": "info"
            }]
            updated_count += 1
        else:
            new_cust = Customer(
                customer_id=item.id,
                name=item.name,
                phone=item.phone or f"0300-1111111",
                whatsapp=item.phone or f"0300-1111111",
                address=item.address or "Karachi, Pakistan",
                area=item.area or "Jamali Goth",
                package_id=item.packageId,
                package_name=pkg_name,
                monthly_charges=monthly_charges,
                installation_charges=0,
                router_mac=item.routerMac,
                onu_number=f"ONUM-{uuid.uuid4().hex[:6].upper()}",
                connection_date=now_str,
                connection_status=item.connectionStatus,
                payment_status="Unpaid",
                outstanding_balance=0,
                timeline=[{
                    "id": str(uuid.uuid4()),
                    "title": "Connection Activated (Import)",
                    "description": f"Registered via batch import under package {pkg_name}.",
                    "date": now_time_str,
                    "type": "success"
                }],
                notes=[]
            )
            db.add(new_cust)
            inserted_count += 1

    db.commit()

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Customers Imported",
        details=f"Batch imported {inserted_count} new records, updated {updated_count} existing records."
    )
    activity_log_repository.create(db, db_obj=log)

    return {
        "insertedCount": inserted_count,
        "updatedCount": updated_count
    }
