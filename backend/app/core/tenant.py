from contextvars import ContextVar
from typing import Optional
from fastapi import Request, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.tenant import Tenant

# Context variable to store the current tenant ID
tenant_context: ContextVar[str] = ContextVar("tenant_id", default="friends_network")

def get_tenant_id() -> str:
    return tenant_context.get()

def set_tenant_id(tenant_id: str) -> None:
    tenant_context.set(tenant_id)

def resolve_tenant_by_host(db: Session, host: str) -> Optional[Tenant]:
    # Extract domain from host (e.g. billing.ispname.pk:8000 -> billing.ispname.pk)
    domain = host.split(":")[0].lower()
    
    # Ignore localhost, 127.0.0.1, or local IP for default fallback
    if domain in ("localhost", "127.0.0.1", "localhost.localdomain"):
        return None
        
    tenant = db.query(Tenant).filter(Tenant.domain == domain).first()
    if not tenant:
        # Match by prefix/name if exact domain match is not found (e.g., ispname.friendsnetwork.net -> ispname)
        parts = domain.split(".")
        if len(parts) > 2:
            subdomain = parts[0]
            tenant = db.query(Tenant).filter(Tenant.name.ilike(subdomain)).first()
            
    return tenant
