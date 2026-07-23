from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.customer import Customer
from backend.app.models.payment import Payment
from backend.app.models.invoice import Invoice
from backend.app.models.notification import Notification
from backend.app.models.log import ActivityLog
from backend.app.repositories.customer import customer_repository
from backend.app.repositories.payment import payment_repository
from backend.app.repositories.invoice import invoice_repository
from backend.app.repositories.notification import notification_repository
from backend.app.repositories.log import activity_log_repository
from backend.app.repositories.package import package_repository
from backend.app.schemas.payment import PaymentSchema

router = APIRouter()

@router.get("/", response_model=List[PaymentSchema])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return payment_repository.get_multi(db)

@router.post("/", response_model=PaymentSchema)
def receive_payment(
    customerId: str,
    amountReceived: int,
    paymentMethod: str,
    referenceNumber: str = None,
    discount: int = 0,
    remarks: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    customer = customer_repository.get_by_customer_id(db, customer_id=customerId)
    if not customer:
        customer = customer_repository.get(db, id=customerId)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Generate receipt number
    receipt_count = db.query(Payment).count()
    rec_num = f"FN-REC-2026-{(receipt_count + 1):06d}"

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Construct payment record
    payment_db = Payment(
        receipt_number=rec_num,
        customer_id=customer.customer_id,
        customer_name=customer.name,
        amount_received=amountReceived,
        payment_method=paymentMethod,
        reference_number=referenceNumber,
        payment_date=now_str,
        billing_month="July 2026",
        received_by=current_user.full_name
    )

    created_payment = payment_repository.create(db, db_obj=payment_db)

    # Update customer billing states
    prev_balance = customer.outstanding_balance
    new_balance = max(0, prev_balance - amountReceived - discount)
    customer.outstanding_balance = new_balance
    
    if new_balance == 0:
        customer.payment_status = "Paid"
        if customer.connection_status != "Active":
            customer.connection_status = "Active"
            customer.timeline = list(customer.timeline) + [{
                "id": str(uuid.uuid4()),
                "title": "Connection Activated (Auto)",
                "description": "Service connection automatically restored upon payment clearance.",
                "date": now_str,
                "type": "success"
            }]
    elif amountReceived > 0:
        customer.payment_status = "Pending"
    else:
        customer.payment_status = "Unpaid"

    # Add timeline event
    customer.timeline = list(customer.timeline) + [{
        "id": str(uuid.uuid4()),
        "title": "Payment Received",
        "description": f"Paid PKR {amountReceived} via {paymentMethod}. Remaining Balance: PKR {new_balance}.",
        "date": now_str,
        "type": "success"
    }]

    # Update the corresponding invoice if it exists
    invoices = invoice_repository.get_by_customer_id(db, customer_id=customer.customer_id)
    if invoices:
        unpaid_invoices = [inv for inv in invoices if inv.payment_status != "Paid"]
        if unpaid_invoices:
            target_invoice = unpaid_invoices[0]
            target_invoice.amount_paid += amountReceived
            target_invoice.outstanding_balance = new_balance
            target_invoice.payment_status = customer.payment_status

    db.commit()
    db.refresh(customer)

    # Sync state to MikroTik if they were activated / kept active
    if customer.connection_status == "Active":
        from backend.app.core.mikrotik_service import sync_customer_to_router
        sync_customer_to_router(db, customer, disable=False)

    from backend.app.core.events import event_system
    event_system.trigger_event_sync(
        db=db,
        tenant_id=created_payment.tenant_id or "friends_network",
        event_type="Payment Received",
        title="Payment Received",
        message=f"{customer.customer_id} ({customer.name}) paid PKR {amountReceived} via {paymentMethod}.",
        details=f"Received PKR {amountReceived} from {customer.name} ({customer.customer_id}) - Receipt {rec_num}",
        user_id=current_user.id,
        username=current_user.username
    )

    return created_payment

@router.post("/bulk-change-package")
def bulk_change_package(
    customerIds: List[str],
    packageId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    pkg = package_repository.get(db, id=packageId)
    if not pkg:
        raise HTTPException(status_code=400, detail="Invalid package selected")

    updated_count = 0
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for cid in customerIds:
        customer = customer_repository.get_by_customer_id(db, customer_id=cid)
        if not customer:
            customer = customer_repository.get(db, id=cid)
        if customer:
            customer.package_id = pkg.id
            customer.package_name = pkg.name
            customer.monthly_charges = pkg.monthly_charges
            
            # Add timeline event
            customer.timeline = list(customer.timeline) + [{
                "id": str(uuid.uuid4()),
                "title": "Package Changed",
                "description": f"Package updated to {pkg.name} ({pkg.speed}) at PKR {pkg.monthly_charges}/mo via bulk migration.",
                "date": now_str,
                "type": "info"
            }]
            updated_count += 1

    db.commit()

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Package Changed",
        details=f"Bulk migrated {updated_count} customers to package {pkg.name}"
    )
    activity_log_repository.create(db, db_obj=log)

    return {"message": f"Successfully updated package for {updated_count} customers"}

@router.post("/bulk-status-active")
def bulk_status_active(
    customerIds: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    updated_count = 0
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for cid in customerIds:
        customer = customer_repository.get_by_customer_id(db, customer_id=cid)
        if not customer:
            customer = customer_repository.get(db, id=cid)
        if customer and customer.connection_status != "Active":
            customer.connection_status = "Active"
            customer.timeline = list(customer.timeline) + [{
                "id": str(uuid.uuid4()),
                "title": "Connection Restored",
                "description": "Service connection restored by bulk activation.",
                "date": now_str,
                "type": "success"
            }]
            updated_count += 1

    db.commit()

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Connection Restored",
        details=f"Bulk activated connection for {updated_count} customer accounts"
    )
    activity_log_repository.create(db, db_obj=log)

    return {"message": f"Successfully activated {updated_count} customers"}

@router.get("/{id}/pdf")
def get_payment_receipt_pdf(
    id: str,
    db: Session = Depends(get_db)
):
    from fastapi.responses import Response
    from backend.app.services.pdf_generator import generate_receipt_pdf
    
    payment = db.query(Payment).filter((Payment.id == id) | (Payment.receipt_number == id)).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
        
    customer = db.query(Customer).filter(Customer.customer_id == payment.customer_id).first()
    
    payment_dict = {
        "id": payment.id,
        "receipt_number": payment.receipt_number,
        "payment_date": payment.payment_date,
        "customer_id": payment.customer_id,
        "customer_name": payment.customer_name,
        "amount_received": payment.amount_received,
        "payment_method": payment.payment_method,
        "reference_number": payment.reference_number,
        "received_by": payment.received_by
    }
    
    customer_dict = {}
    if customer:
        customer_dict = {
            "name": customer.name,
            "phone": customer.phone
        }
        
    pdf_bytes = generate_receipt_pdf(payment_dict, customer_dict)
    filename = f"Receipt_{payment.receipt_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )
