from fastapi import APIRouter
from backend.app.api.endpoints import (
    auth,
    customer,
    package,
    payment,
    billing,
    complaint,
    reports,
    settings,
    notification,
    balance_sheet,
    upload,
    backup,
    router as m_router,
    health,
    tenant,
    license,
    platform,
    ai,
    customer_portal,
    mobile_api,
    noc,
    procurement,
    finance,
    communication,
    document,
    public_api,
    ai_admin,
    ai_customer,
    ai_technician,
    ai_knowledge,
    ai_reports,
    automation,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(customer.router, prefix="/customers", tags=["customers"])
api_router.include_router(package.router, prefix="/packages", tags=["packages"])
api_router.include_router(payment.router, prefix="/payments", tags=["payments"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(complaint.router, prefix="/complaints", tags=["complaints"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(notification.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(balance_sheet.router, prefix="/balance-sheet", tags=["balance-sheet"])
api_router.include_router(upload.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(backup.router, prefix="/backup", tags=["backup"])
api_router.include_router(m_router.router, prefix="/routers", tags=["routers"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(tenant.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(license.router, prefix="/license", tags=["license"])
api_router.include_router(platform.router, prefix="/platform", tags=["platform"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(customer_portal.router, prefix="/portal", tags=["portal"])
api_router.include_router(mobile_api.router, prefix="/mobile", tags=["mobile"])
api_router.include_router(noc.router, prefix="/noc", tags=["noc"])
api_router.include_router(procurement.router, prefix="/procurement", tags=["procurement"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(communication.router, prefix="/communication", tags=["communication"])
api_router.include_router(document.router, prefix="/document", tags=["document"])
api_router.include_router(public_api.router, prefix="/public", tags=["public"])
api_router.include_router(ai_admin.router, prefix="/ai-admin", tags=["ai-admin"])
api_router.include_router(ai_customer.router, prefix="/ai-customer", tags=["ai-customer"])
api_router.include_router(ai_technician.router, prefix="/ai-technician", tags=["ai-technician"])
api_router.include_router(ai_knowledge.router, prefix="/ai-knowledge", tags=["ai-knowledge"])
api_router.include_router(ai_reports.router, prefix="/ai-reports", tags=["ai-reports"])
api_router.include_router(automation.router, prefix="/automation", tags=["automation"])
