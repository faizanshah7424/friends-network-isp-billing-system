from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user
from backend.app.models.user import User

router = APIRouter()

MOCK_WEBHOOKS = [
    {"id": "wh-1", "url": "https://api.mycrm.com/webhooks/payments", "events": ["Payment Received"], "status": "Active"},
    {"id": "wh-2", "url": "https://integrations.billinghub.pk/callback", "events": ["Invoice Generated", "Complaint Created"], "status": "Active"}
]

class WebhookSubscribeRequest(BaseModel):
    url: str
    events: List[str]

class APIKeyGenerateRequest(BaseModel):
    client_name: str

# Helper to verify third-party API Keys (Module 11)
def verify_api_key(
    x_api_key: str = Header(..., alias="X-API-Key")
) -> str:
    # Example authentication check - in production, lookup client_name or hashed key in DB
    if not x_api_key.startswith("FN-API-KEY-"):
        raise HTTPException(status_code=401, detail="Invalid API Key credentials")
    return x_api_key

@router.get("/webhooks")
def list_webhooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return MOCK_WEBHOOKS

@router.post("/webhooks")
def subscribe_webhook(
    req: WebhookSubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_wh = {
        "id": f"wh-{len(MOCK_WEBHOOKS) + 1}",
        "url": req.url,
        "events": req.events,
        "status": "Active"
    }
    MOCK_WEBHOOKS.append(new_wh)
    return new_wh

@router.delete("/webhooks/{id}")
def unsubscribe_webhook(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    wh = next((w for w in MOCK_WEBHOOKS if w["id"] == id), None)
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook subscription not found")
    MOCK_WEBHOOKS.remove(wh)
    return wh

@router.post("/generate-api-key")
def generate_api_key(
    req: APIKeyGenerateRequest,
    current_user: User = Depends(get_current_active_user)
):
    import uuid
    key = f"FN-API-KEY-{uuid.uuid4().hex.upper()}"
    return {
        "clientName": req.client_name,
        "apiKey": key,
        "createdAt": datetime.now().strftime("%Y-%m-%d")
    }

# Endpoint to dispatch webhook simulations (for testing Module 12)
@router.post("/dispatch-simulation")
def simulate_webhook_dispatch(
    event_type: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    dispatched_count = 0
    for wh in MOCK_WEBHOOKS:
        if event_type in wh["events"]:
            # Real deployment would execute: requests.post(wh["url"], json={"event": event_type, "data": payload})
            print(f"[Webhook Engine] Dispatched event '{event_type}' to endpoint: {wh['url']} - Payload: {payload}")
            dispatched_count += 1
            
    return {"status": "Dispatched", "targetEndpoints": dispatched_count}
