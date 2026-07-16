from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user
from backend.app.models.user import User

router = APIRouter()

MOCK_CAMPAIGNS = [
    {"id": "camp-1", "name": "August Billing WhatsApp Broadcast", "channel": "WhatsApp", "targetGroup": "All Active Customers", "scheduledTime": "2026-08-01 09:00 AM", "status": "Scheduled"},
    {"id": "camp-2", "name": "Fiber Outage Maintenance SMS Alert", "channel": "SMS", "targetGroup": "Jamali Goth area", "scheduledTime": "2026-07-16 02:00 PM", "status": "Completed"}
]

MOCK_LOGS = [
    {"id": "msg-1", "recipient": "Muhammad Shahid (0300-1112223)", "channel": "WhatsApp", "message": "Dear customer, your invoice for July 2026 of 2000 PKR is due by 2026-07-10.", "timestamp": "2026-07-01 10:00 AM", "status": "Delivered"},
    {"id": "msg-2", "recipient": "Noor Jamal (0300-9998887)", "channel": "SMS", "message": "Fiber link restored in your sector. Thank you for your patience.", "timestamp": "2026-07-16 03:00 PM", "status": "Delivered"}
]

class CampaignCreate(BaseModel):
    name: str
    channel: str  # "WhatsApp" | "SMS" | "Email"
    target_group: str
    scheduled_time: str
    message_body: str

class DirectMessageRequest(BaseModel):
    recipient: str
    channel: str
    message: str

@router.get("/campaigns")
def get_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return MOCK_CAMPAIGNS

@router.post("/campaigns")
def create_campaign(
    req: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_camp = {
        "id": f"camp-{len(MOCK_CAMPAIGNS) + 1}",
        "name": req.name,
        "channel": req.channel,
        "targetGroup": req.target_group,
        "scheduledTime": req.scheduled_time,
        "status": "Scheduled"
    }
    MOCK_CAMPAIGNS.append(new_camp)
    return new_camp

@router.get("/logs")
def get_message_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return MOCK_LOGS

@router.post("/send-direct")
def send_direct_message(
    req: DirectMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Log the sent message
    new_msg = {
        "id": f"msg-{1000 + len(MOCK_LOGS) + 1}",
        "recipient": req.recipient,
        "channel": req.channel,
        "message": req.message,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "status": "Delivered"
    }
    MOCK_LOGS.append(new_msg)
    
    # In real deployment, this would interface with a WhatsApp API (e.g. Twilio, Meta API) or SMS gateway.
    print(f"[Unified Communication] Message successfully dispatched via {req.channel} to {req.recipient}")
    return {"status": "Dispatched", "messageId": new_msg["id"]}
