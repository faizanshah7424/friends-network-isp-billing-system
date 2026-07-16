from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user, PermissionChecker
from backend.app.models.user import User

router = APIRouter()

# Simple mock backend database store for AI Audits and Settings
# to avoid complex db migrations while maintaining a clean, fully functional state.
MOCK_SETTINGS = {
    "provider": "Google Gemini",
    "model": "gemini-3.5-flash",
    "temperature": 0.7,
    "maxTokens": 2048,
    "systemPrompt": "You are Antigravity-ISP, an autonomous AI assistant for Friends Network. Respect tenant isolation and role restrictions. Answer based on operational tables.",
    "rateLimit": 100
}

MOCK_AUDITS = [
    {
        "id": "audit-1",
        "username": "superadmin",
        "modelUsed": "gemini-3.5-flash",
        "prompt": "Show unpaid customers in Gulshan area",
        "response": "Found 3 unpaid customer profiles in Gulshan.",
        "tokensUsed": 124,
        "executionTimeMs": 245,
        "timestamp": "2026-07-16 11:20 AM"
    },
    {
        "id": "audit-2",
        "username": "subadmin",
        "modelUsed": "gpt-4o",
        "prompt": "Check connection status for customer FN-1002",
        "response": "Customer Noor Jamal is currently Active on MikroTik Router Clifton-Core.",
        "tokensUsed": 85,
        "executionTimeMs": 182,
        "timestamp": "2026-07-16 02:45 PM"
    }
]

class AISettingsUpdate(BaseModel):
    provider: str
    model: str
    temperature: float
    maxTokens: int
    systemPrompt: str
    rateLimit: int

@router.get("/settings")
def get_ai_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return MOCK_SETTINGS

@router.post("/settings")
def update_ai_settings(
    req: AISettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    global MOCK_SETTINGS
    MOCK_SETTINGS = {
        "provider": req.provider,
        "model": req.model,
        "temperature": req.temperature,
        "maxTokens": req.maxTokens,
        "systemPrompt": req.systemPrompt,
        "rateLimit": req.rateLimit
    }
    
    print(f"[Model Management] AI parameters updated: Provider={req.provider}, Model={req.model}, Temp={req.temperature}")
    return MOCK_SETTINGS

@router.get("/audits")
def get_ai_audits(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    return MOCK_AUDITS

# Helper to log queries to audit history
def log_ai_audit(username: str, prompt: str, response: str, model: str, tokens: int, latency_ms: int):
    MOCK_AUDITS.insert(0, {
        "id": f"audit-{str(uuid.uuid4())[:8]}",
        "username": username,
        "modelUsed": model,
        "prompt": prompt,
        "response": response,
        "tokensUsed": tokens,
        "executionTimeMs": latency_ms,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p")
    })
    # Keep last 50 audits
    if len(MOCK_AUDITS) > 50:
        MOCK_AUDITS.pop()
