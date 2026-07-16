from fastapi import APIRouter
from backend.app.api.endpoints import erp, tenant

api_router_v2 = APIRouter()

# Register new V2 ERP and SaaS Tenant endpoints
api_router_v2.include_router(erp.router, prefix="/erp", tags=["erp"])
api_router_v2.include_router(tenant.router, prefix="/tenants", tags=["tenants"])
