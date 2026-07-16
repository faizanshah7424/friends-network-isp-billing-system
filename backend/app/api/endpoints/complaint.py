from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from datetime import datetime
import uuid

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.complaint import Complaint
from backend.app.models.notification import Notification
from backend.app.models.log import ActivityLog
from backend.app.repositories.complaint import complaint_repository
from backend.app.repositories.customer import customer_repository
from backend.app.repositories.notification import notification_repository
from backend.app.repositories.log import activity_log_repository
from backend.app.schemas.complaint import ComplaintSchema, ComplaintCreate, ComplaintUpdate

router = APIRouter()

@router.get("/", response_model=List[ComplaintSchema])
def list_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return complaint_repository.get_multi(db)

@router.get("/{id}", response_model=ComplaintSchema)
def get_complaint(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    complaint = complaint_repository.get(db, id=id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@router.post("/", response_model=ComplaintSchema)
def create_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    customer = customer_repository.get_by_customer_id(db, customer_id=complaint_in.customer_id)
    if not customer:
        customer = customer_repository.get(db, id=complaint_in.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Generate ticket number
    ticket_count = db.query(Complaint).count()
    ticket_num = f"TIC-10{24 + ticket_count}"

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    now_date_str = datetime.now().strftime("%Y-%m-%d")

    complaint_db = Complaint(
        ticket_number=ticket_num,
        customer_id=customer.customer_id,
        customer_name=customer.name,
        mobile_number=complaint_in.mobile_number or customer.phone,
        area=customer.area,
        category=complaint_in.category,
        issue=complaint_in.issue,
        priority=complaint_in.priority or "Medium",
        assigned_engineer=complaint_in.assigned_engineer,
        status="Pending",
        date_created=now_date_str,
        timeline=[
            {
                "status": "Pending",
                "date": now_str,
                "comment": "Ticket created by system operator."
            }
        ]
    )

    created = complaint_repository.create(db, db_obj=complaint_db)

    from backend.app.core.events import event_system
    event_system.trigger_event_sync(
        db=db,
        tenant_id=created.tenant_id or "friends_network",
        event_type="Complaint Added",
        title="Complaint Ticket Created",
        message=f"{customer.name} ({customer.customer_id}) reported: {ticket_num}. Priority: {created.priority}",
        details=f"Registered complaint ticket {ticket_num} for customer {customer.name} - Category: {created.category}",
        user_id=current_user.id,
        username=current_user.username
    )

    return created

@router.put("/{id}", response_model=ComplaintSchema)
def update_complaint(
    id: str,
    complaint_in: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    complaint = complaint_repository.get(db, id=id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    timeline_updates = []

    # Detect modifications to construct timeline events
    if complaint_in.assigned_engineer and complaint_in.assigned_engineer != complaint.assigned_engineer:
        timeline_updates.append({
            "status": complaint.status,
            "date": now_str,
            "comment": f"Ticket assigned to engineer {complaint_in.assigned_engineer} by {current_user.username}."
        })

    if complaint_in.status and complaint_in.status != complaint.status:
        timeline_updates.append({
            "status": complaint_in.status,
            "date": now_str,
            "comment": f"Status updated to '{complaint_in.status}' by {current_user.username}."
        })
        if complaint_in.status == "Resolved" and not complaint_in.resolved_date:
            complaint_in.resolved_date = datetime.now().strftime("%Y-%m-%d")

    # Perform update
    updated = complaint_repository.update(db, db_obj=complaint, obj_in=complaint_in)

    if timeline_updates:
        updated.timeline = list(updated.timeline) + timeline_updates
        db.commit()
        db.refresh(updated)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Complaint Status Updated",
        details=f"Updated status of support ticket {updated.ticket_number} to {updated.status}"
    )
    activity_log_repository.create(db, db_obj=log)

    return updated
