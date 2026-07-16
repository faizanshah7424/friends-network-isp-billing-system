from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from backend.app.api.deps import get_db
from backend.app.api.endpoints.customer_portal import get_current_portal_customer
from backend.app.models.customer import Customer
from backend.app.models.invoice import Invoice
from backend.app.models.payment import Payment
from backend.app.models.complaint import Complaint
from backend.app.models.package import Package
from backend.app.core.events import event_system

router = APIRouter()

class CustomerQuery(BaseModel):
    message: str

@router.post("/chat")
def customer_ai_chat(
    req: CustomerQuery,
    token: str,
    db: Session = Depends(get_db)
):
    # Retrieve customer context from Portal JWT
    customer = get_current_portal_customer(token, db)
    
    msg = req.message.lower()
    response_text = ""
    action_triggered = None
    
    # 1. Check due amount
    if "due" in msg or "outstanding" in msg or "balance" in msg or "bills" in msg:
        response_text = f"Dear {customer.name}, your outstanding dues total is **{customer.outstanding_balance} PKR**. Your monthly package bill is {customer.monthly_charges} PKR."
        
    # 2. View payment history
    elif "payment" in msg or "paid" in msg or "receipt" in msg or "history" in msg:
        recent_pay = db.query(Payment).filter(Payment.customer_id == customer.customer_id).order_by(Payment.created_at.desc()).first()
        if recent_pay:
            response_text = f"Your last payment of **{recent_pay.amount_received} PKR** was received on **{recent_pay.payment_date}** via {recent_pay.payment_method}."
        else:
            response_text = "No prior payments registered on your ledger. Please pay outstanding invoices to avoid internet suspension."
            
    # 3. Check complaint status
    elif "complaint" in msg or "ticket" in msg or "status" in msg or "slow" in msg or "fiber" in msg:
        recent_comp = db.query(Complaint).filter(Complaint.customer_id == customer.customer_id).order_by(Complaint.created_at.desc()).first()
        if recent_comp:
            response_text = f"Your recent support ticket **{recent_comp.ticket_number}** ({recent_comp.category}) is currently in **{recent_comp.status}** state. Technician assigned: {recent_comp.assigned_engineer or 'Pending'}."
        else:
            response_text = "You do not have any open service tickets. If you are experiencing outages, type 'Raise a ticket' to report an issue."
            
    # 4. Package details & upgrades
    elif "upgrade" in msg or "package" in msg or "speed" in msg:
        response_text = f"Your current package is **{customer.package_name}** ({customer.monthly_charges} PKR/mo). You can upgrade to our Premium 50Mbps static IP packages. Type 'Confirm package upgrade' to initiate automatic provisioning."
        
    # 5. Escalation request
    elif "human" in msg or "operator" in msg or "agent" in msg or "support" in msg:
        response_text = "I am escalating your request to a live support desk operator. An engineer will contact you shortly on your registered contact number."
        action_triggered = "Escalate to Operator"
        
        # Dispatch alert
        event_system.trigger_event_sync(
            db=db,
            tenant_id=customer.tenant_id,
            event_type="Notification Created",
            title="Operator Escalation Requested",
            message=f"Customer {customer.name} ({customer.customer_id}) requested live operator transfer in portal chat.",
            username=customer.name
        )
        
    # 6. Fallback FAQ
    else:
        response_text = f"Hello {customer.name}! I am your Friends Network AI Customer Assistant. I can help you check due amounts, view payments, lodge complaints, check ticket status, or transfer you to a human operator. What can I do for you?"
        
    return {
        "reply": response_text,
        "action": action_triggered,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p")
    }
