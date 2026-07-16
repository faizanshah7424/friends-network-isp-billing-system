import hashlib
import hmac
import json
import base64
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.tenant import Tenant
from backend.app.core.config import settings

router = APIRouter()

# Secret key for license signature verification
LICENSE_SIGNING_KEY = settings.SECRET_KEY.encode()

class LicenseGenerateRequest(BaseModel):
    tenant_id: str
    plan: str
    expiry_days: int

class LicenseGenerateResponse(BaseModel):
    license_key: str
    expiry_date: datetime

class LicenseActivateRequest(BaseModel):
    license_key: str
    hardware_fingerprint: str

class OfflineVerifyRequest(BaseModel):
    activation_payload: str

def compute_license_signature(tenant_id: str, plan: str, expiry_str: str) -> str:
    message = f"{tenant_id}|{plan}|{expiry_str}".encode()
    sig = hmac.new(LICENSE_SIGNING_KEY, message, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(sig).decode().rstrip("=")

def generate_key_from_parts(tenant_id: str, plan: str, expiry_date: datetime) -> str:
    expiry_str = expiry_date.strftime("%Y-%m-%d")
    sig = compute_license_signature(tenant_id, plan, expiry_str)
    # Form a key: FN-PLAN-EXPIRY-SIG_PREFIX
    sig_prefix = sig[:12]
    key_raw = f"{tenant_id[:4].upper()}-{plan.upper()}-{expiry_str}-{sig_prefix}"
    return key_raw

@router.post("/generate", response_model=LicenseGenerateResponse)
def generate_license(
    req: LicenseGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    # Retrieve tenant
    tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.id == req.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    expiry_date = datetime.utcnow() + timedelta(days=req.expiry_days)
    license_key = generate_key_from_parts(tenant.id, req.plan, expiry_date)
    
    # Store license and expiry on tenant
    tenant.license_key = license_key
    tenant.subscription_expiry = expiry_date
    tenant.subscription_plan = req.plan
    db.commit()
    
    return LicenseGenerateResponse(
        license_key=license_key,
        expiry_date=expiry_date
    )

@router.post("/activate")
def activate_license(
    req: LicenseActivateRequest,
    db: Session = Depends(get_db)
):
    # Locate tenant with this license key
    tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.license_key == req.license_key).first()
    if not tenant:
        raise HTTPException(status_code=400, detail="Invalid license key")
        
    # Verify expiry
    if tenant.subscription_expiry and tenant.subscription_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="License has expired")
        
    # Store hardware fingerprint for machine locking
    tenant.hardware_fingerprint = req.hardware_fingerprint
    tenant.is_activated = True
    db.commit()
    
    # Generate activation token containing signed verification payload for offline use
    payload = {
        "tenant_id": tenant.id,
        "license_key": tenant.license_key,
        "hardware_fingerprint": tenant.hardware_fingerprint,
        "expiry": tenant.subscription_expiry.strftime("%Y-%m-%d") if tenant.subscription_expiry else None,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    payload_json = json.dumps(payload)
    sig = hmac.new(LICENSE_SIGNING_KEY, payload_json.encode(), hashlib.sha256).digest()
    activation_token = base64.b64encode(payload_json.encode() + b"." + sig).decode()
    
    return {
        "status": "Activated",
        "tenant_name": tenant.name,
        "activation_token": activation_token
    }

@router.post("/deactivate")
def deactivate_license(
    license_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.license_key == license_key).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="License not found on any tenant")
        
    tenant.is_activated = False
    tenant.hardware_fingerprint = None
    db.commit()
    
    return {"status": "Deactivated", "tenant_name": tenant.name}

@router.post("/verify-offline")
def verify_offline(
    req: OfflineVerifyRequest
):
    try:
        token_bytes = base64.b64decode(req.activation_payload.encode())
        parts = token_bytes.split(b".")
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid activation payload format")
            
        payload_json, signature = parts[0], parts[1]
        
        # Verify signature
        expected_sig = hmac.new(LICENSE_SIGNING_KEY, payload_json, hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected_sig):
            raise HTTPException(status_code=400, detail="Activation payload signature verification failed")
            
        payload = json.loads(payload_json.decode())
        
        # Check expiry
        expiry_str = payload.get("expiry")
        if expiry_str:
            expiry_date = datetime.strptime(expiry_str, "%Y-%m-%d")
            if expiry_date < datetime.utcnow():
                return {
                    "valid": False,
                    "reason": "Expired",
                    "payload": payload
                }
                
        return {
            "valid": True,
            "reason": "Verified Offline",
            "payload": payload
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process offline verification: {str(e)}")

@router.get("/status")
def license_status(
    db: Session = Depends(get_db)
):
    from backend.app.core.tenant import tenant_context
    tid = tenant_context.get()
    
    tenant = db.query(Tenant).execution_options(bypass_tenant=True).filter(Tenant.id == tid).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    return {
        "tenant_id": tenant.id,
        "license_key": tenant.license_key,
        "is_activated": tenant.is_activated,
        "hardware_fingerprint": tenant.hardware_fingerprint,
        "plan": tenant.subscription_plan,
        "expiry": tenant.subscription_expiry,
        "days_remaining": (tenant.subscription_expiry - datetime.utcnow()).days if tenant.subscription_expiry else None
    }
