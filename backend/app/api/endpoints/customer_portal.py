from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.app.api.deps import get_db
from backend.app.models.customer import Customer
from backend.app.models.payment import Payment
from backend.app.models.invoice import Invoice
from backend.app.models.complaint import Complaint
from backend.app.models.package import Package
from backend.app.core.security import get_password_hash, verify_password
from backend.app.core.events import event_system
from jose import jwt
from datetime import datetime, timedelta
from backend.app.core.config import settings

router = APIRouter()

class PortalLoginRequest(BaseModel):
    customer_id: str
    password: str

class PortalProfileUpdate(BaseModel):
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    address: Optional[str] = None
    password: Optional[str] = None

class PortalComplaintCreate(BaseModel):
    issue: str
    category: str

# Helper to verify token inside customer portal request
def get_current_portal_customer(
    token: str,
    db: Session = Depends(get_db)
) -> Customer:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        customer_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    # Query customer bypassing isolation to fetch from current context
    cust = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust

@router.post("/login")
def portal_login(
    req: PortalLoginRequest,
    db: Session = Depends(get_db)
):
    # Lookup customer
    cust = db.query(Customer).filter(Customer.customer_id == req.customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer ID not registered")
        
    # Check credentials: if portal_password_hash is not set, allow using their phone number as initial password
    if cust.portal_password_hash:
        valid = verify_password(req.password, cust.portal_password_hash)
    else:
        # Fallback to phone number or 'password123'
        valid = (req.password == cust.phone or req.password == "password123" or req.password == cust.ppp_password)
        
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    # Generate access token
    expiry = datetime.utcnow() + timedelta(days=1)
    token = jwt.encode(
        {"sub": cust.customer_id, "exp": expiry},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return {
        "accessToken": token,
        "customerId": cust.customer_id,
        "name": cust.name,
        "packageName": cust.package_name
    }

@router.get("/dashboard")
def get_portal_dashboard(
    customer: Customer = Depends(get_current_portal_customer),
    db: Session = Depends(get_db)
):
    # Get payments, invoices, complaints
    invoices = db.query(Invoice).filter(Invoice.customer_id == customer.customer_id).all()
    payments = db.query(Payment).filter(Payment.customer_id == customer.customer_id).all()
    complaints = db.query(Complaint).filter(Complaint.customer_id == customer.customer_id).all()
    
    return {
        "customer": {
            "id": customer.customer_id,
            "name": customer.name,
            "phone": customer.phone,
            "whatsapp": customer.whatsapp,
            "address": customer.address,
            "area": customer.area,
            "packageName": customer.package_name,
            "monthlyCharges": customer.monthly_charges,
            "outstandingBalance": customer.outstanding_balance,
            "connectionStatus": customer.connectionStatus if hasattr(customer, "connectionStatus") else customer.connection_status,
            "paymentStatus": customer.paymentStatus if hasattr(customer, "paymentStatus") else customer.payment_status,
        },
        "invoices": [{
            "id": i.id,
            "invoiceNumber": i.invoice_number,
            "billingMonth": i.billing_month,
            "grandTotal": i.grand_total,
            "amountPaid": i.amount_paid,
            "outstandingBalance": i.outstanding_balance,
            "paymentStatus": i.payment_status,
            "billingDate": i.billing_date,
            "dueDate": i.due_date
        } for i in invoices],
        "payments": [{
            "receiptNumber": p.receipt_number,
            "amountReceived": p.amount_received,
            "paymentMethod": p.payment_method,
            "paymentDate": p.payment_date,
            "billingMonth": p.billing_month
        } for p in payments],
        "complaints": [{
            "ticketNumber": c.ticket_number,
            "category": c.category,
            "issue": c.issue,
            "priority": c.priority,
            "status": c.status,
            "dateCreated": c.date_created,
            "resolvedDate": c.resolved_date,
            "timeline": c.timeline
        } for c in complaints]
    }

@router.post("/complaints")
def portal_create_complaint(
    req: PortalComplaintCreate,
    customer: Customer = Depends(get_current_portal_customer),
    db: Session = Depends(get_db)
):
    ticket_num = f"TIC-{datetime.now().strftime('%Y')}-{db.query(Complaint).count() + 1001}"
    comp = Complaint(
        tenant_id=customer.tenant_id,
        ticket_number=ticket_num,
        customer_id=customer.customer_id,
        customer_name=customer.name,
        mobile_number=customer.phone,
        area=customer.area,
        category=req.category,
        issue=req.issue,
        priority="Medium",
        status="Pending",
        date_created=datetime.now().strftime("%Y-%m-%d"),
        timeline=[{"status": "Pending", "date": datetime.now().strftime("%Y-%m-%d %I:%M %p"), "comment": "Ticket created by customer self-service portal"}]
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    
    # Broadcast event
    event_system.trigger_event_sync(
        db=db,
        tenant_id=customer.tenant_id,
        event_type="Complaint Created",
        title="Portal Support Ticket Raised",
        message=f"Customer {customer.name} raised ticket {ticket_num} via portal.",
        details=req.issue,
        username=customer.name
    )
    
    return {"status": "Created", "ticketNumber": ticket_num}

@router.post("/profile")
def portal_update_profile(
    req: PortalProfileUpdate,
    customer: Customer = Depends(get_current_portal_customer),
    db: Session = Depends(get_db)
):
    if req.phone:
        customer.phone = req.phone
    if req.whatsapp:
        customer.whatsapp = req.whatsapp
    if req.address:
        customer.address = req.address
    if req.password:
        customer.portal_password_hash = get_password_hash(req.password)
        
    db.commit()
    return {"status": "Success", "message": "Profile updated successfully"}
