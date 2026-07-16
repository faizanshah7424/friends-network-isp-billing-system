from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user
from backend.app.models.user import User
from backend.app.models.complaint import Complaint
from backend.app.core.events import event_system
from backend.app.core.s3 import upload_to_storage

router = APIRouter()

class CheckinRequest(BaseModel):
    ticket_id: str
    latitude: float
    longitude: float

class CheckoutRequest(BaseModel):
    ticket_id: str
    latitude: float
    longitude: float
    engineer_notes: str
    signature_url: Optional[str] = None
    photo_url: Optional[str] = None

class OfflineSyncItem(BaseModel):
    action: str  # "checkin" | "checkout"
    ticket_id: str
    latitude: float
    longitude: float
    timestamp: str
    notes: Optional[str] = None
    signature_url: Optional[str] = None
    photo_url: Optional[str] = None

@router.get("/jobs")
def get_technician_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Fetch complaints assigned to this technician/user
    # Matching by engineer full name
    jobs = db.query(Complaint).filter(
        Complaint.assigned_engineer == current_user.full_name,
        Complaint.status != "Resolved",
        Complaint.status != "Closed"
    ).all()
    
    return [{
        "id": j.id,
        "ticketNumber": j.ticket_number,
        "customerName": j.customer_name,
        "mobileNumber": j.mobile_number,
        "area": j.area,
        "category": j.category,
        "issue": j.issue,
        "priority": j.priority,
        "status": j.status,
        "dateCreated": j.date_created,
        "checkinLat": j.checkin_lat,
        "checkinLon": j.checkin_lon,
        "signatureUrl": j.signature_url,
        "photoUrl": j.photo_url
    } for j in jobs]

@router.post("/checkin")
def technician_checkin(
    req: CheckinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == req.ticket_id).first()
    if not complaint:
        complaint = db.query(Complaint).filter(Complaint.ticket_number == req.ticket_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    complaint.checkin_lat = req.latitude
    complaint.checkin_lon = req.longitude
    complaint.checkin_time = datetime.now().strftime("%Y-%m-%d %I:%M %p")
    complaint.status = "In Progress"
    
    # Append to timeline
    timeline = list(complaint.timeline)
    timeline.append({
        "status": "In Progress",
        "date": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "comment": f"Technician checked in at coordinates ({req.latitude}, {req.longitude})"
    })
    complaint.timeline = timeline
    db.commit()
    
    # Broadcast event
    event_system.trigger_event_sync(
        db=db,
        tenant_id=complaint.tenant_id,
        event_type="Complaint Updated",
        title="Technician Checked-In",
        message=f"Technician {current_user.full_name} checked-in at site for {complaint.ticket_number}.",
        details=f"GPS: ({req.latitude}, {req.longitude})",
        user_id=current_user.id,
        username=current_user.username
    )
    
    return {"status": "Success", "checkinTime": complaint.checkin_time}

@router.post("/checkout")
def technician_checkout(
    req: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == req.ticket_id).first()
    if not complaint:
        complaint = db.query(Complaint).filter(Complaint.ticket_number == req.ticket_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    complaint.checkout_lat = req.latitude
    complaint.checkout_lon = req.longitude
    complaint.checkout_time = datetime.now().strftime("%Y-%m-%d %I:%M %p")
    complaint.engineer_notes = req.engineer_notes
    complaint.status = "Resolved"
    complaint.resolved_date = datetime.now().strftime("%Y-%m-%d")
    
    if req.signature_url:
        complaint.signature_url = req.signature_url
    if req.photo_url:
        complaint.photo_url = req.photo_url
        
    # Append to timeline
    timeline = list(complaint.timeline)
    timeline.append({
        "status": "Resolved",
        "date": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "comment": f"Technician resolved ticket. GPS: ({req.latitude}, {req.longitude}). Notes: {req.engineer_notes}"
    })
    complaint.timeline = timeline
    db.commit()
    
    # Broadcast event
    event_system.trigger_event_sync(
        db=db,
        tenant_id=complaint.tenant_id,
        event_type="Complaint Resolved",
        title="Support Ticket Resolved",
        message=f"Ticket {complaint.ticket_number} resolved by {current_user.full_name}.",
        details=req.engineer_notes,
        user_id=current_user.id,
        username=current_user.username
    )
    
    return {"status": "Success", "checkoutTime": complaint.checkout_time}

@router.post("/upload-signature")
async def upload_signature(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    content = await file.read()
    # Upload signature image to storage
    url = upload_to_storage(content, file.filename, "image/png")
    return {"signatureUrl": url}

@router.post("/offline-sync")
def sync_offline_queue(
    req: List[OfflineSyncItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"[Mobile Sync] Syncing {len(req)} cached events from mobile offline queue...")
    synced_count = 0
    for item in req:
        complaint = db.query(Complaint).filter(Complaint.id == item.ticket_id).first()
        if not complaint:
            complaint = db.query(Complaint).filter(Complaint.ticket_number == item.ticket_id).first()
        if not complaint:
            continue
            
        if item.action == "checkin":
            complaint.checkin_lat = item.latitude
            complaint.checkin_lon = item.longitude
            complaint.checkin_time = item.timestamp
            complaint.status = "In Progress"
            
            timeline = list(complaint.timeline)
            timeline.append({
                "status": "In Progress",
                "date": item.timestamp,
                "comment": f"[Offline Synced] Technician checked in at coordinates ({item.latitude}, {item.longitude})"
            })
            complaint.timeline = timeline
            synced_count += 1
            
        elif item.action == "checkout":
            complaint.checkout_lat = item.latitude
            complaint.checkout_lon = item.longitude
            complaint.checkout_time = item.timestamp
            complaint.engineer_notes = item.notes
            complaint.status = "Resolved"
            complaint.resolved_date = item.timestamp.split(" ")[0]
            
            if item.signature_url:
                complaint.signature_url = item.signature_url
            if item.photo_url:
                complaint.photo_url = item.photo_url
                
            timeline = list(complaint.timeline)
            timeline.append({
                "status": "Resolved",
                "date": item.timestamp,
                "comment": f"[Offline Synced] Ticket resolved. Notes: {item.notes}. GPS: ({item.latitude}, {item.longitude})"
            })
            complaint.timeline = timeline
            synced_count += 1
            
    db.commit()
    return {"status": "Synced", "syncedCount": synced_count}
