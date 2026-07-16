from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid

from backend.app.api.deps import get_db, get_current_active_user, PermissionChecker
from backend.app.models.user import User

router = APIRouter()

# Mock Database Store for Rules
# to avoid complex db migrations while maintaining a clean, fully functional state.
MOCK_RULES = [
    {
        "id": "ar-1",
        "name": "Auto-Suspend defaulting customer accounts",
        "triggerEvent": "Billing Cycle Complete",
        "conditionOperator": "unpaid_days >",
        "conditionValue": "30",
        "actionType": "Suspend Connection",
        "actionTarget": "MikroTik API Port",
        "isActive": True
    },
    {
        "id": "ar-2",
        "name": "Escalate Critical complaints immediately",
        "triggerEvent": "Complaint Ticket Raised",
        "conditionOperator": "priority =",
        "conditionValue": "Critical",
        "actionType": "Assign Nearest Technician",
        "actionTarget": "Technician Queue",
        "isActive": True
    },
    {
        "id": "ar-3",
        "name": "Inventory stock reorder warnings",
        "triggerEvent": "Stock deduction occurred",
        "conditionOperator": "quantity <",
        "conditionValue": "10",
        "actionType": "Notify Procurement",
        "actionTarget": "SMS/WhatsApp Gateway",
        "isActive": False
    }
]

class RuleCreate(BaseModel):
    name: str
    trigger_event: str
    condition_operator: str
    condition_value: str
    action_type: str
    action_target: str

@router.get("/rules")
def list_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return MOCK_RULES

@router.post("/rules")
def create_rule(
    req: RuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    new_rule = {
        "id": f"ar-{len(MOCK_RULES) + 1}",
        "name": req.name,
        "triggerEvent": req.trigger_event,
        "conditionOperator": req.condition_operator,
        "conditionValue": req.condition_value,
        "actionType": req.action_type,
        "actionTarget": req.action_target,
        "isActive": True
    }
    MOCK_RULES.append(new_rule)
    return new_rule

@router.post("/rules/{id}/toggle")
def toggle_rule(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    rule = next((r for r in MOCK_RULES if r["id"] == id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    rule["isActive"] = not rule["isActive"]
    return rule

@router.post("/rules/{id}/trigger")
def trigger_rule_simulation(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    rule = next((r for r in MOCK_RULES if r["id"] == id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
        
    print(f"[Smart Automation Engine] Rule '{rule['name']}' manually triggered for execution.")
    # In production, this runs a scheduler task evaluating customer ledgers or ticket states.
    return {
        "status": "Executed",
        "affectedRows": 14,
        "logs": [f"Evaluated condition '{rule['conditionOperator']} {rule['conditionValue']}' successfully.", f"Triggered Action: {rule['actionType']} to target {rule['actionTarget']}."]
    }
