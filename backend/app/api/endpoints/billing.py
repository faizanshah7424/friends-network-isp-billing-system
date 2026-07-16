from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.customer import Customer
from backend.app.models.invoice import Invoice
from backend.app.repositories.invoice import invoice_repository
from backend.app.repositories.customer import customer_repository
from backend.app.repositories.log import activity_log_repository
from backend.app.models.log import ActivityLog
from backend.app.schemas.invoice import InvoiceSchema, InvoiceCreate

router = APIRouter()

@router.get("/", response_model=List[InvoiceSchema])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return invoice_repository.get_multi(db)

@router.get("/{id}", response_model=InvoiceSchema)
def get_invoice(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    invoice = invoice_repository.get(db, id=id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/", response_model=InvoiceSchema)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    customer = customer_repository.get_by_customer_id(db, customer_id=invoice_in.customer_id)
    if not customer:
        customer = customer_repository.get(db, id=invoice_in.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    invoice_count = db.query(Invoice).count()
    inv_num = f"FN-INV-2026-{(invoice_count + 1):06d}"

    # Calculate grand total and outstanding
    subtotal = invoice_in.monthly_charges + invoice_in.previous_due + invoice_in.additional_charges
    grand_total = max(0, subtotal - invoice_in.discount)

    inv_db = Invoice(
        invoice_number=inv_num,
        customer_id=customer.customer_id,
        customer_name=customer.name,
        billing_month=invoice_in.billing_month,
        monthly_charges=invoice_in.monthly_charges,
        previous_due=invoice_in.previous_due,
        additional_charges=invoice_in.additional_charges,
        discount=invoice_in.discount,
        grand_total=grand_total,
        amount_paid=0,
        outstanding_balance=grand_total,
        payment_status="Unpaid",
        billing_date=invoice_in.billing_date,
        due_date=invoice_in.due_date
    )
    
    # Update customer outstanding balance and status
    customer.outstanding_balance = customer.outstanding_balance + grand_total
    customer.payment_status = "Unpaid"
    
    # Append to timeline
    customer.timeline = list(customer.timeline) + [{
        "id": str(uuid.uuid4()),
        "title": "Invoice Generated",
        "description": f"Invoice {inv_num} generated for {invoice_in.billing_month} for PKR {grand_total}.",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "type": "info"
    }]

    created = invoice_repository.create(db, db_obj=inv_db)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Invoice Generated",
        details=f"Generated custom invoice {inv_num} for customer {customer.name} - PKR {grand_total}"
    )
    activity_log_repository.create(db, db_obj=log)

    return created

@router.post("/generate-monthly")
def generate_monthly_billing(
    billingMonth: str,
    dueDate: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    # Find all active customers
    active_customers = db.query(Customer).filter(Customer.connection_status == "Active").all()
    
    generated_count = 0
    skipped_count = 0
    now_str = datetime.now().strftime("%Y-%m-%d")

    for customer in active_customers:
        # Check if invoice already exists for this customer and month
        exists = db.query(Invoice).filter(
            Invoice.customer_id == customer.customer_id,
            Invoice.billing_month == billingMonth
        ).first()
        
        if exists:
            skipped_count += 1
            continue
            
        invoice_count = db.query(Invoice).count()
        inv_num = f"FN-INV-2026-{(invoice_count + 1):06d}"
        
        # Calculate invoice charges
        pkg_charges = customer.monthly_charges
        prev_due = customer.outstanding_balance
        grand_total = pkg_charges + prev_due
        
        # Create Invoice
        inv_db = Invoice(
            invoice_number=inv_num,
            customer_id=customer.customer_id,
            customer_name=customer.name,
            billing_month=billingMonth,
            monthly_charges=pkg_charges,
            previous_due=prev_due,
            additional_charges=0,
            discount=0,
            grand_total=grand_total,
            amount_paid=0,
            outstanding_balance=grand_total,
            payment_status="Unpaid",
            billing_date=now_str,
            due_date=dueDate
        )
        db.add(inv_db)
        
        # Increment customer outstanding balance
        customer.outstanding_balance = grand_total
        customer.payment_status = "Unpaid"
        
        # Append to timeline
        customer.timeline = list(customer.timeline) + [{
            "id": str(uuid.uuid4()),
            "title": "Monthly Bill Generated",
            "description": f"Invoice {inv_num} generated for {billingMonth}. Charge: PKR {pkg_charges}.",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "type": "info"
        }]
        
        generated_count += 1

    db.commit()

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Invoice Generated",
        details=f"Ran monthly billing cycle for {billingMonth}. Generated {generated_count} invoices, skipped {skipped_count} duplicates."
    )
    activity_log_repository.create(db, db_obj=log)

    return {"message": f"Successfully generated {generated_count} invoices. Skipped {skipped_count} existing."}
